// SYNCHRO / RAILMASTER – ESP32-Firmware
// Empfängt JSON-Befehle der Web-App per WebSocket (Port 81) und erzeugt daraus das DCC-Gleissignal.
//
// Benötigte Bibliotheken (Arduino Library Manager):
//   - "WebSockets" von Markus Sattler (Links2004)
//   - "ArduinoJson" von Benoit Blanchon (v7)
// Board: "ESP32 Dev Module", Arduino-ESP32 Core 3.x

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include "dcc.h"

// ── WLAN ───────────────────────────────────────────────────
// Leer lassen = ESP32 spannt ein eigenes WLAN "SYNCHRO" auf (IP 192.168.4.1)
const char* WIFI_SSID = "";
const char* WIFI_PASS = "";
const char* AP_SSID   = "SYNCHRO";
const char* AP_PASS   = "synchro123";     // mind. 8 Zeichen

const char* FW_VERSION = "0.1";
const uint32_t WATCHDOG_MS = 3000;        // nichts vom Browser → alle Loks stoppen

WebSocketsServer ws(81);

struct Loco { uint16_t addr; uint8_t speed; int8_t dir; uint32_t fn; bool used; };
const int MAX_LOCOS = 16;
Loco locos[MAX_LOCOS];

bool trackOn = false;
bool estopActive = false;
uint32_t lastRx = 0;

// Einmal-Pakete (Geschwindigkeitswechsel, CV) haben Vorrang vor dem Dauer-Refresh
const int QMAX = 16;
dcc::Packet q[QMAX]; int qHead = 0, qTail = 0;
void enqueue(const dcc::Packet& p) { int n = (qTail + 1) % QMAX; if (n != qHead) { q[qTail] = p; qTail = n; } }

Loco* findLoco(uint16_t addr, bool create) {
  for (auto& l : locos) if (l.used && l.addr == addr) return &l;
  if (!create) return nullptr;
  for (auto& l : locos) if (!l.used) { l = {addr, 0, 1, 0, true}; return &l; }
  return nullptr;
}

void broadcastStatus() {
  JsonDocument d; d["t"] = "status"; d["power"] = trackOn; d["estop"] = estopActive;
  String s; serializeJson(d, s); ws.broadcastTXT(s);
}

void setPower(bool on) {
  trackOn = on;
  dcc::trackPower(on);
}

void stopAll(bool emergency) {
  for (auto& l : locos) if (l.used) {
    l.speed = 0;
    enqueue(dcc::speed(l.addr, 0, l.dir, emergency));
  }
}

void handle(uint8_t client, const JsonDocument& d) {
  const char* t = d["t"] | "";
  if (!strcmp(t, "hello")) {
    JsonDocument r; r["t"] = "hello"; r["fw"] = FW_VERSION; r["power"] = trackOn;
    String s; serializeJson(r, s); ws.sendTXT(client, s);
  } else if (!strcmp(t, "ping")) {
    // lastRx wurde schon aktualisiert
  } else if (!strcmp(t, "power")) {
    bool on = d["on"] | false;
    if (!on) stopAll(false);
    setPower(on); estopActive = !on && estopActive; broadcastStatus();
  } else if (!strcmp(t, "estop")) {
    estopActive = true; stopAll(true); broadcastStatus();
  } else if (!strcmp(t, "loco")) {
    uint16_t addr = d["addr"] | 0;
    if (addr < 1 || addr > 10239) return;
    Loco* l = findLoco(addr, true);
    if (!l) return;
    l->speed = constrain((int)(d["speed"] | 0), 0, 100);
    l->dir   = ((int)(d["dir"] | 1)) < 0 ? -1 : 1;
    uint32_t fn = 0;
    for (JsonVariantConst v : d["fn"].as<JsonArrayConst>()) { int n = v | -1; if (n >= 0 && n <= 28) fn |= (1UL << n); }
    l->fn = fn;
    estopActive = false;
    enqueue(dcc::speed(addr, l->speed, l->dir));
  } else if (!strcmp(t, "cv")) {
    uint16_t addr = d["addr"] | 0, cv = d["cv"] | 0; int val = d["val"] | -1;
    if (addr >= 1 && cv >= 1 && cv <= 1024 && val >= 0 && val <= 255) enqueue(dcc::cvWrite(addr, cv, val));
  }
}

void onWs(uint8_t client, WStype_t type, uint8_t* payload, size_t len) {
  if (type == WStype_DISCONNECTED) {
    if (ws.connectedClients() == 0) stopAll(false);       // Verbindung weg → Loks anhalten
  } else if (type == WStype_TEXT) {
    lastRx = millis();
    JsonDocument d;
    if (!deserializeJson(d, payload, len)) handle(client, d);
  }
}

void setup() {
  Serial.begin(115200);
  dcc::begin();

  bool sta = strlen(WIFI_SSID) > 0;
  if (sta) {
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    uint32_t t0 = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) delay(250);
    sta = WiFi.status() == WL_CONNECTED;
  }
  if (!sta) { WiFi.softAP(AP_SSID, AP_PASS); Serial.print("AP "); Serial.println(AP_SSID); }
  Serial.print("IP: "); Serial.println(sta ? WiFi.localIP() : WiFi.softAPIP());

  ws.begin(); ws.onEvent(onWs);
  lastRx = millis();
}

void loop() {
  ws.loop();

  // Watchdog: Browser meldet sich nicht mehr → Loks anhalten (einmalig)
  static bool wdFired = false;
  if (ws.connectedClients() > 0) {
    if (millis() - lastRx > WATCHDOG_MS) { if (!wdFired) { stopAll(false); wdFired = true; } }
    else wdFired = false;
  }

  // Nächstes DCC-Paket nachliefern, sobald die ISR bereit ist
  if (dcc::wantsPacket()) {
    static int rr = 0, step = 0;
    if (qHead != qTail) { dcc::submit(q[qHead]); qHead = (qHead + 1) % QMAX; return; }
    for (int tries = 0; tries < MAX_LOCOS; tries++) {
      rr = (rr + 1) % MAX_LOCOS;
      if (!locos[rr].used) continue;
      Loco& l = locos[rr];
      if (step == 0) dcc::submit(dcc::speed(l.addr, l.speed, l.dir));
      else dcc::submit(dcc::functions(l.addr, l.fn, step - 1));
      if (++step > 5) step = 0;
      return;
    }
    dcc::submit(dcc::idle());
  }
}
