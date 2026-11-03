# Datenaustausch Browser ↔ ESP32

Stand: Firmware `0.1`. Grundlage sind `esp32-link.js` (Browser), `app.jsx` (Aufrufer) und `synchro_esp32.ino` / `dcc.h` (Firmware).

## Überblick

| Eigenschaft | Wert |
|-------------|------|
| Transport | WebSocket, Textframes, **Port 81**, URL `ws://<IP>:81/` |
| Format | JSON, ein Objekt pro Nachricht, Feld `t` bestimmt den Typ |
| ESP32-IP | `192.168.4.1` im eigenen WLAN `SYNCHRO` (Passwort `synchro123`), sonst die IP aus dem Heimnetz |
| Clients | Mehrere gleichzeitig möglich. Status-Meldungen gehen an alle. |
| Binär-Daten | Keine. Der Browser sendet kein DCC, nur Befehle. Der ESP32 baut daraus das DCC-Signal. |

## 1. Browser → ESP32 (Befehle)

### `hello` – Verbindungsaufbau
```json
{ "t": "hello", "client": "railmaster" }
```
Wird direkt nach dem Öffnen der Verbindung gesendet. Erst nach der Antwort des ESP32 gilt die Verbindung im Browser als aktiv. Das Feld `client` wird vom ESP32 nicht ausgewertet.

### `ping` – Heartbeat
```json
{ "t": "ping" }
```
Jede Sekunde. Jede empfangene Nachricht setzt den Watchdog zurück. Der Ping sorgt dafür, dass auch bei Ruhe etwas ankommt (siehe Sicherheitsverhalten).

### `power` – Gleisstrom
```json
{ "t": "power", "on": true }
```
| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `on` | bool | `true` = Gleis an (Enable-Pin HIGH), `false` = Gleis aus. Fehlt das Feld, gilt `false`. |

- Bei `on: false` werden zuerst alle Loks auf Geschwindigkeit 0 gesetzt, dann wird der Strom abgeschaltet.
- Der Browser sendet `power` bei jeder Änderung von „Strom“ oder „Not-Aus“ und nach jedem (Wieder-)Verbinden, damit der ESP32 den aktuellen Stand bekommt. Gesendet wird `power && !emergency`.
- Ein `power` mit `on: true` hebt einen aktiven Not-Aus-Zustand auf.

### `estop` – Not-Aus
```json
{ "t": "estop" }
```
Setzt `estop = true` und sendet allen bekannten Loks den DCC-Nothalt (Fahrstufe 1). Der Gleisstrom bleibt zunächst an. Der Browser schickt direkt danach `power` mit `on: false`. Wartende Lok-Befehle im Browser werden vorher verworfen, damit nichts nachträglich Gas gibt.

### `loco` – Lok fahren
```json
{ "t": "loco", "addr": 3, "speed": 55, "dir": 1, "fn": [0, 1, 4] }
```
| Feld | Typ | Bereich | Bedeutung |
|------|-----|---------|-----------|
| `addr` | int | 1–10239 | DCC-Adresse. Außerhalb: Nachricht wird ignoriert. |
| `speed` | int | 0–100 | Geschwindigkeit in Prozent, wird auf 0–100 begrenzt. 0 = Halt. |
| `dir` | int | `1` / `-1` | Richtung. Alles `< 0` zählt als rückwärts. |
| `fn` | int[] | je 0–28 | Liste der **eingeschalteten** Funktionen. Nicht enthaltene sind aus. |

- Der ESP32 legt die Lok beim ersten Befehl an. Maximal **16 Loks**, weitere werden ignoriert.
- Der Browser sendet nur, wenn sich eine Lok geändert hat. Befehle pro Adresse werden auf höchstens einen alle **50 ms** zusammengefasst (Regler-Ziehen).
- Ein `loco`-Befehl hebt den Not-Aus-Zustand (`estop`) auf.

### `cv` – CV im Betrieb schreiben (POM)
```json
{ "t": "cv", "addr": 3, "cv": 3, "val": 12 }
```
| Feld | Typ | Bereich |
|------|-----|---------|
| `addr` | int | ≥ 1 |
| `cv` | int | 1–1024 |
| `val` | int | 0–255 |

Ungültige Werte werden ohne Meldung verworfen. Es kommt keine Bestätigung zurück. Der Browser sendet nur, wenn der Wert 1–3 Ziffern hat.

## 2. ESP32 → Browser (Antworten und Meldungen)

Der ESP32 kennt nur diese zwei Nachrichten.

### `hello` – Antwort auf `hello`
```json
{ "t": "hello", "fw": "0.1", "power": false }
```
| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `fw` | string | Firmware-Version |
| `power` | bool | Aktueller Gleisstrom |

Nur an den anfragenden Client. Der Browser wertet dies als „verbunden“.

### `status` – Zustandsänderung
```json
{ "t": "status", "power": true, "estop": false }
```
| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `power` | bool | Gleisstrom an/aus |
| `estop` | bool | Not-Aus aktiv |

Wird an **alle** Clients gesendet, nachdem `power` oder `estop` verarbeitet wurde. Der Browser mischt die Felder in seinen Verbindungsstatus.

### Nicht vorhanden
Der ESP32 sendet derzeit **nichts** zu: Lok-Bestätigungen, CV-Rückmeldung oder -Lesen, Stromverbrauch / Kurzschluss, Weichen- und Signalzustand, Gleisbelegt-Meldungen, Fehlermeldungen. Ungültige oder unbekannte Nachrichten werden stillschweigend ignoriert. Weichen, Signale und Zubehör werden von der Firmware noch nicht angesteuert.

## 3. Sicherheitsverhalten (Watchdog)

| Ereignis | Reaktion des ESP32 |
|----------|--------------------|
| Mehr als **3 s** keine Nachricht vom Browser (bei bestehender Verbindung) | Alle Loks werden einmalig auf Geschwindigkeit 0 gesetzt. Der Gleisstrom bleibt an. |
| Letzter Client trennt die Verbindung | Alle Loks auf Geschwindigkeit 0 |
| Verbindung im Browser bricht ab | Neuer Versuch alle 2 s. Nach erfolgreichem Verbinden wird `power` neu gesendet. |

Beim Wiederverbinden löscht der Browser seinen Zwischenspeicher der zuletzt gesendeten Lok-Werte und sendet alle Loks neu.

## 4. Umsetzung in DCC (ESP32 → Gleis)

| Befehl | DCC-Paket |
|--------|-----------|
| `loco` Geschwindigkeit | 128-Fahrstufen-Befehl (`0x3F`). 0 % = Fahrstufe 0, 1–100 % = Stufe 2–127, Nothalt = Stufe 1. Richtung im obersten Bit. |
| `loco` Funktionen | F0–F4, F5–F8, F9–F12, F13–F20, F21–F28 (je eine Gruppe), werden reihum wiederholt |
| `cv` | CV-Byte-Schreiben im Betrieb (POM, `0xEC`), CV 1–1024 |
| Adresse 1–127 | kurze Adresse (1 Byte) |
| Adresse ab 128 | lange Adresse (2 Byte, `0xC0`-Präfix) |
| nichts zu senden | Idle-Paket |

Geschwindigkeitswechsel und CV-Pakete gehen über eine Warteschlange (16 Plätze) und haben Vorrang. Danach läuft ein Dauer-Refresh über alle bekannten Loks (Geschwindigkeit, dann Funktionsgruppen).

## 5. Bekannte Einschränkungen

- Die Firmware ist **noch nicht an echter Hardware getestet**.
- Kein Lesen von CVs und keine Rückmeldung bei CV-Schreiben.
- Keine Kurzschluss- oder Stromerkennung, daher ist eine Strombegrenzung in der Hardware Pflicht.
- Der Browser bekommt nicht mit, wenn der ESP32 einen `loco`- oder `cv`-Befehl verwirft.
- Keine Authentifizierung am WebSocket. Wer im WLAN ist, kann fahren.
