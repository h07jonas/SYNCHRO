# ESP32-Anbindung

Die Web-App spricht per **WebSocket (Port 81, JSON)** mit dem ESP32. Der ESP32 erzeugt daraus das DCC-Signal.

## Einrichten
1. Arduino IDE → Board-Paket *esp32* (Core **3.x**) installieren.
2. Bibliotheken: **WebSockets** (Markus Sattler) und **ArduinoJson** (v7).
3. `esp32/synchro_esp32/synchro_esp32.ino` öffnen, optional WLAN-Daten oben eintragen, hochladen.
   Ohne WLAN-Daten öffnet der ESP32 das WLAN **SYNCHRO** (Passwort `synchro123`), IP `192.168.4.1`.
4. PC ins gleiche WLAN, `start_localhost.bat` starten, oben in der Leiste die IP eintragen → **ESP32 verbinden**.

## Verdrahtung (H-Brücke)
| ESP32 | H-Brücke |
|-------|----------|
| GPIO 25 | Eingang A |
| GPIO 26 | Eingang B (invertiert zu A) |
| GPIO 27 | Enable (HIGH = Gleis an) |

Der ESP32 darf **nicht** direkt ans Gleis. Die H-Brücke muss zur Gleisspannung und zum Strom passen,
und eine Strombegrenzung bzw. Kurzschlusserkennung ist Pflicht. Pins ändern: Defines in `dcc.h`.

## Protokoll (Browser → ESP32)
| Nachricht | Bedeutung |
|-----------|-----------|
| `{"t":"hello"}` | Verbindungsaufbau, ESP32 antwortet `{"t":"hello","fw":"0.1","power":false}` |
| `{"t":"ping"}` | Heartbeat jede Sekunde. Fehlt er >3 s, stoppt der ESP32 alle Loks |
| `{"t":"power","on":true}` | Gleisstrom ein/aus |
| `{"t":"estop"}` | Not-Aus: DCC-Nothalt an alle bekannten Loks |
| `{"t":"loco","addr":3,"speed":0-100,"dir":1\|-1,"fn":[0,1]}` | Geschwindigkeit (in %), Richtung, aktive Funktionen |
| `{"t":"cv","addr":3,"cv":3,"val":12}` | CV im Betrieb schreiben (POM) |

ESP32 → Browser: `{"t":"status","power":bool,"estop":bool}` bei Änderungen.

## Status
Kommunikation (WebSocket, Protokoll, Watchdog) und DCC-Paketbau sind geschrieben, aber **noch nicht an
echter Hardware getestet**. Erst ohne Lok und mit Oszilloskop/Logic-Analyzer das Signal prüfen.
