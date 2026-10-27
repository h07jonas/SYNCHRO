// DCC-Signalerzeugung für ESP32 (Arduino-ESP32 Core 3.x).
// Zwei komplementäre Pins (DCC_A/DCC_B) gehen an die Eingänge einer H-Brücke (z.B. L298N IN1/IN2,
// LMD18200 DIR+PWM, DRV8871 ...). Ein Enable-Pin schaltet das Gleis.
#pragma once
#include <Arduino.h>

#define DCC_PIN_A   25
#define DCC_PIN_B   26
#define DCC_PIN_EN  27   // HIGH = Gleis an

namespace dcc {

struct Packet { uint8_t data[6]; uint8_t len; };

// ── ISR-Seite ──────────────────────────────────────────────
static hw_timer_t* timer = nullptr;
static volatile uint8_t  bits[96];
static volatile uint8_t  bitCount = 0, bitIdx = 0, phase = 0, curBit = 1;
static volatile uint8_t  nextBits[96];
static volatile uint8_t  nextCount = 0;
static volatile bool     nextReady = false;

static void IRAM_ATTR onHalfBit() {
  if (phase == 0) {                       // Beginn eines neuen Bits
    if (bitIdx >= bitCount) {             // Paket zu Ende → nächstes übernehmen (oder wiederholen)
      if (nextReady) {
        for (uint8_t i = 0; i < nextCount; i++) bits[i] = nextBits[i];
        bitCount = nextCount; nextReady = false;
      }
      bitIdx = 0;
    }
    curBit = bitCount ? bits[bitIdx++] : 1;
    digitalWrite(DCC_PIN_A, HIGH); digitalWrite(DCC_PIN_B, LOW);
    phase = 1;
  } else {
    digitalWrite(DCC_PIN_A, LOW);  digitalWrite(DCC_PIN_B, HIGH);
    phase = 0;
  }
  timerAlarm(timer, curBit ? 58 : 100, true, 0);   // µs pro Halbbit: 1 = 58, 0 = 100
}

// ── Paket → Bitstrom ───────────────────────────────────────
static void buildBits(const Packet& p, volatile uint8_t* out, uint8_t& n) {
  n = 0;
  for (int i = 0; i < 14; i++) out[n++] = 1;              // Präambel
  uint8_t x = 0;
  for (uint8_t b = 0; b < p.len; b++) {
    out[n++] = 0;                                          // Trennbit
    for (int k = 7; k >= 0; k--) out[n++] = (p.data[b] >> k) & 1;
    x ^= p.data[b];
  }
  out[n++] = 0;
  for (int k = 7; k >= 0; k--) out[n++] = (x >> k) & 1;    // Prüfbyte
  out[n++] = 1;                                            // Endbit
}

// true, wenn der ISR bereit für das nächste Paket ist
inline bool wantsPacket() { return !nextReady; }

inline void submit(const Packet& p) {
  uint8_t n; buildBits(p, nextBits, n);
  nextCount = n; nextReady = true;
}

inline void begin() {
  pinMode(DCC_PIN_A, OUTPUT); pinMode(DCC_PIN_B, OUTPUT); pinMode(DCC_PIN_EN, OUTPUT);
  digitalWrite(DCC_PIN_EN, LOW);
  Packet idle = {{0xFF, 0x00}, 2};
  buildBits(idle, bits, bitCount);
  timer = timerBegin(1000000);                             // 1 MHz
  timerAttachInterrupt(timer, &onHalfBit);
  timerAlarm(timer, 100, true, 0);
}

inline void trackPower(bool on) { digitalWrite(DCC_PIN_EN, on ? HIGH : LOW); }

// ── Paketbau ───────────────────────────────────────────────
static uint8_t putAddr(Packet& p, uint16_t addr) {
  if (addr <= 127) { p.data[0] = addr; return 1; }
  p.data[0] = 0xC0 | (addr >> 8); p.data[1] = addr & 0xFF; return 2;
}

// pct 0..100, dir +1/-1, estop → Schrittwert 1
inline Packet speed(uint16_t addr, uint8_t pct, int dir, bool estop = false) {
  Packet p; uint8_t i = putAddr(p, addr);
  uint8_t step = estop ? 1 : (pct == 0 ? 0 : 2 + (uint8_t)((pct * 125 + 50) / 100));   // 128-Fahrstufen: 2..127
  p.data[i++] = 0x3F;
  p.data[i++] = (dir >= 0 ? 0x80 : 0x00) | step;
  p.len = i; return p;
}

// Gruppe 0: F0-F4, 1: F5-F8, 2: F9-F12, 3: F13-F20, 4: F21-F28
inline Packet functions(uint16_t addr, uint32_t fn, uint8_t group) {
  Packet p; uint8_t i = putAddr(p, addr);
  auto b = [&](int n) { return (uint8_t)((fn >> n) & 1); };
  switch (group) {
    case 0: p.data[i++] = 0x80 | (b(0) << 4) | (b(4) << 3) | (b(3) << 2) | (b(2) << 1) | b(1); break;
    case 1: p.data[i++] = 0xB0 | (b(8) << 3) | (b(7) << 2) | (b(6) << 1) | b(5); break;
    case 2: p.data[i++] = 0xA0 | (b(12) << 3) | (b(11) << 2) | (b(10) << 1) | b(9); break;
    case 3: p.data[i++] = 0xDE; p.data[i++] = (fn >> 13) & 0xFF; break;
    default: p.data[i++] = 0xDF; p.data[i++] = (fn >> 21) & 0xFF; break;
  }
  p.len = i; return p;
}

// CV schreiben im Betrieb (POM), cv 1..1024
inline Packet cvWrite(uint16_t addr, uint16_t cv, uint8_t val) {
  Packet p; uint8_t i = putAddr(p, addr);
  p.data[i++] = 0xEC | (((cv - 1) >> 8) & 0x03);
  p.data[i++] = (cv - 1) & 0xFF;
  p.data[i++] = val;
  p.len = i; return p;
}

inline Packet idle() { Packet p = {{0xFF, 0x00}, 2}; return p; }

}  // namespace dcc
