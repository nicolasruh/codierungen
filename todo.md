# Aufgabenplan

Die Umsetzung erfolgt in kleinen, funktionierenden und geprüften Iterationen. Anforderungen und Entscheidungen stehen in [context.md](./context.md). Iterationen 1–4 dokumentieren den ursprünglichen Stand; Iteration 5 ersetzt dessen Navigation und Schrittsteuerung.

## Vorbereitung

- [x] Projektkontext dokumentieren.
- [x] Iterativen Aufgabenplan anlegen.
- [x] Offene Entscheidungen mit dem Auftraggeber klären.
- [x] Bestätigte Entscheidungen im Kontext nachführen.

## Iteration 1: Automatisches MVP

- [x] Statische HTML/CSS/JavaScript-Grundstruktur ohne externe Ressourcen anlegen.
- [x] Decodierungslogik von Darstellung und späterer Lernschrittsteuerung trennen.
- [x] Responsive Oberfläche mit Daten, Informationen und Modusbereich aufbauen.
- [x] Biteingabe mit sichtbarer Validierung und 64-Bit-Grenze implementieren.
- [x] Leeren und ungültigen Zustand eindeutig behandeln.
- [x] Codierungsauswahl für Ganzzahlen, Zeichen, Farben und Wahrheitswerte anbieten.
- [x] Standard-Decodierung: 8-Bit-Ganzzahlen, ASCII im 8-Bit-Block, RGB24 und 1-Bit-Wahrheitswerte.
- [x] Linksseitiges Padding nur für die Interpretation implementieren und kennzeichnen.
- [x] Blöcke mit zugeordneten Ergebnissen anzeigen; rechten Block standardmäßig aktivieren.
- [x] Ganzzahlen mit `BigInt` verlustfrei verarbeiten.
- [x] MVP anhand konkreter Beispiele und Grenzfälle prüfen.

## Iteration 2: Navigation und Erklärungen

- [x] Blockauswahl per Klick und Pfeilen implementieren.
- [x] Fragezeichen am aktiven Block und zugängliches Detail-Overlay ergänzen.
- [x] Ganzzahldetails mit Stellenwerten und Berechnung anzeigen.
- [x] Zeichentabelle mit markiertem Eintrag, Steuerzeichen und unbelegten Positionen anzeigen.
- [x] Farbdetails mit Kanälen, Werten, Anteilen und Farbergebnis anzeigen.
- [x] Boolean-Zuordnung erklären.
- [x] Sichtbaren Dezimal/Hex-Schalter mit tiefgestellter Basis ergänzen.
- [x] Tastaturbedienung, Fokusführung, Schließen des Overlays und mobile Darstellung prüfen.

## Iteration 3: Interaktiver Lernmodus

- [x] Moduswechsel und klaren Übungszustand implementieren.
- [x] Schritt 1: Padding erklären und Blockgrößen-Slider mit Vorschau anbieten.
- [x] Gesamte Aufteilung erst nach ausdrücklicher Bestätigung prüfen; Automatisierung nur dieses Schritts anbieten.
- [x] Schritt 2: Verarbeitung der Blöcke von rechts nach links implementieren.
- [x] Zahleneingabe mit Prüfung und Feedback ergänzen.
- [x] Auswahl eines Zeichentabelleneintrags mit Prüfung ergänzen.
- [x] Vereinbarte Farbaufgabe mit Prüfung ergänzen.
- [x] Wahr/Falsch-Auswahl mit Prüfung ergänzen.
- [x] Automatisierung ausschließlich des aktuellen Blocks ergänzen.
- [x] Nicht gelöste Ergebnisse verbergen, ohne benötigte Lerninformationen zu verbergen.
- [x] Schritt 3: vollständiges Ergebnis mit erhaltener Blockzuordnung anzeigen.
- [x] Verhalten bei Eingabe-, Codierungs-, Parameter- und Basiswechsel prüfen.

## Iteration 4: Codierungsparameter und Varianten

- [x] Ganzzahl-Blockgrößen 1–8, 16, 32 und 64 anbieten.
- [x] Eindeutig definierte deutsche, französische und vereinbarte weitere Zeichentabellen integrieren.
- [x] Herkunft, Belegung und Grenzen der Tabellen dokumentieren.
- [x] Farbtiefen 1–24 implementieren.
- [x] Durch drei teilbare Farbtiefen in gleich große Kanäle aufteilen.
- [x] Übrige Farbtiefen als Graustufen interpretieren.
- [x] RGB-, HSB- und LAB-Interpretation mit dokumentierten Wertebereichen implementieren.
- [x] Farbraumumrechnung, Quantisierung und vereinbarten Umgang mit Farbumfang prüfen.
- [x] Umkehrbare Boolean-Zuordnung ergänzen.
- [x] Alle Parameter in automatischen Ergebnissen, Details und Lernschritten konsistent verwenden.

## Prüfungen je betroffener Iteration

- [x] Ausschließlich lokale Ressourcen und keine Serverkommunikation sicherstellen.
- [x] Null, einzelne Bits, führende Nullen, leere Eingabe und ungültige Zeichen prüfen.
- [x] 64 Originalbits akzeptieren, 65 ablehnen.
- [x] Padding über 64 Interpretationsbits hinaus prüfen, insbesondere 64 Bits bei RGB24 → 72 Bits.
- [x] Ganzzahl `11111111` → 255 und 64 Einsen → 18446744073709551615 prüfen.
- [x] ASCII `01000001` → A und `10000001` → unbelegt prüfen.
- [x] RGB24 `100000000011111111000000` → RGB(128, 63, 192) prüfen.
- [x] Boolean `01` → Falsch, Wahr prüfen.
- [x] Wechsel der Codierung ohne Veränderung der Originaldaten prüfen.
- [x] Block-/Wertzuordnung und Auswahl nach Änderungen prüfen.
- [x] Dezimal/Hex-Darstellung einschließlich Basiskennzeichnung prüfen.
- [x] Richtige und falsche Lernantworten sowie einzelne Automatisierungsschritte prüfen.
- [x] Responsive Layout, Tastaturbedienung und verständliches Feedback prüfen.
- [x] Nutzungs- und Architekturhinweise passend zum implementierten Stand dokumentieren.

Ergebnis des ursprünglichen Stands: 12 erfolgreiche Node-Testgruppen und Browserprüfungen direkt über `file://`. Testaufruf und aktueller Stand sind in [context.md](./context.md) dokumentiert.

## Iteration 5: Direkte, kompakte Blockinteraktion

- [x] Daten und Informationen als Hauptbereiche hervorheben; Modus und Parameter in eine dezente Einstellungsleiste verschieben.
- [x] Dez/Hex-Dropdown durch einen Schalter im Overlay ersetzen; Auswahl für weitere Blöcke übernehmen.
- [x] Dreikanal-Farben durch Abstände innerhalb der Bitblöcke gliedern.
- [x] Blockausgaben auf Ergebnis beschränken; Erklärungen nur im Overlay zeigen.
- [x] Padding-Hinweis kürzen und nur bei Bedarf anzeigen.
- [x] Zwölf unbenannte Bitfolgen unterschiedlicher Länge im Beispiel-Dropdown anbieten.
- [x] Aufteilungsaufgabe, feste Decodierungsreihenfolge und Weiter-Schritte entfernen.
- [x] Pfeilnavigation und notwendige Blockaktivierung entfernen; zuletzt verwendeten Block hervorheben.
- [x] An jedem ungelösten Block Manuell/Automatisch anbieten, nach dem Lösen das Fragezeichen.
- [x] Manuelle Aufgaben im Overlay: Zahl mit Stellenwertschema, Zeichentabelle, Farbkanal-Slider und Schwarz/Weiß-Toggle.
- [x] Blockentwürfe, Basiswechsel, Fortschritt und Fokusführung konsistent erhalten.
- [x] Tests der Lernlogik auf unabhängige Blöcke umstellen; 13 Testgruppen erfolgreich.
- [x] Browserprüfungen der neuen Bedienung, Grenzfälle und mobilen Darstellung abschließen.
- [x] Projektkontext auf die neue Bedienung aktualisieren.

Geprüft: alle vier Aufgabenarten, blockweise Automatisierung, zwölf Beispiele, Basis-/Entwurfs-/Scroll-Erhalt, 64-Bit-Grenzfälle, alle Farbtiefen und mobile Darstellung bei 360 Pixeln. 13 Node-Testgruppen erfolgreich; keine Browserfehler oder HTTP-/HTTPS-Anfragen in den geprüften Abläufen.

## Iteration 6: Weiterarbeiten und farbraumspezifische Lernhilfen

- [x] Nach dem Lösen optional direkt die nächste offene Aufgabe öffnen; gelöste Blöcke überspringen und am Ende wieder links beginnen.
- [x] Weiter-Control nach manueller und automatischer Decodierung anbieten; ausblenden, sobald alle Blöcke gelöst sind.
- [x] Zeichenauswahl und Wahr/Falsch-Toggle sofort prüfen; Ganzzahlen und Farben weiterhin ausdrücklich prüfen.
- [x] HSB-Balken und Slider mit Hue, Sättigung und Helligkeit einfärben und live aktualisieren.
- [x] LAB-Achsen grob darstellen: Schwarz/Weiß, Grün/Rot und Blau/Gelb.
- [x] Beabsichtigten Backdrop-Klick von innerhalb gestarteten Drags und abgebrochenen Pointer-Gesten unterscheiden.
- [x] Untertitel auf „Von Daten zu Informationen“ ändern.
- [x] 14 Logik-Testgruppen sowie Browserprüfungen für Sofortprüfung, Weiter-Controls, Farbskalen und mobile Bedienung durchführen.
- [x] Schnelle Slider-Drags über beide Enden, retargetetes Loslassen, Pointer-Abbruch, Backdrop-Klick und Escape prüfen.
- [x] Kontext und Aufgabenplan aktualisieren.

## Iteration 7: Unterscheidbare Zeichentabellen

- [x] „Obere Hälfte unbelegt“ in Auswahl und Overlay durch „zweite Hälfte unbelegt“ ersetzen.
- [x] Nahezu identische französische/spanische Varianten entfernen.
- [x] Deutsch (Windows-1252), Polnisch (Windows-1250) und Kyrillisch (Windows-1251) anbieten.
- [x] ASCII in allen Varianten unverändert erhalten und undefinierte Codepage-Positionen berücksichtigen.
- [x] Unterschiede der zweiten Hälften prüfen: 56 zwischen Deutsch/Polnisch, 97 zwischen Deutsch/Kyrillisch, 96 zwischen Polnisch/Kyrillisch.
- [x] 15 Logik-Testgruppen und Browserprüfungen für Auswahl, gleiche Bits mit unterschiedlichem Zeichen und manuelle kyrillische Auswahl durchführen.
- [x] Vorschlag für eine unabhängige Symboltabelle und UTF-8 in [context.md](./context.md) festhalten.

## Iteration 8: UTF-8 und sichtbare Moduswahl

- [x] UTF-8-Vorschlag nach Freigabe umsetzen; nationale Tabellen unverändert erhalten.
- [x] Optionale variable Segmentierung im Codierungsregister ergänzen.
- [x] UTF-8-Präfixe, Fortsetzungsbytes, Nutzbits und Unicode-Skalarwerte strikt verarbeiten.
- [x] Variable Codepoint-Blöcke und ihre Byte-/Präfixstruktur visualisieren.
- [x] Codepoint-Eingabe im Lernmodus mit Dez/Hex-Entwürfen und zielgerichtetem Feedback ergänzen.
- [x] Aufklappbares lokales Unicode-Raster mit Bereichseingabe, Navigation und Grenzen ergänzen.
- [x] Fehlerblöcke sichtbar erklären, aus Aufgaben/Fortschritt ausschließen und bei Weiter überspringen.
- [x] ASCII, ä, Emoji, gemischte Folgen bis 64 Bit, BOM und ungültige/abgebrochene Folgen prüfen.
- [x] Sämtliche 65.792 Ein-/Zweibytefolgen mit einem strikten UTF-8-Referenzdecoder abgleichen.
- [x] Modus-Dropdown durch einen tastaturbedienbaren Schalter ersetzen.
- [x] Gesamte Seite je nach Modus blau bzw. orange gestalten; sichtbare Modusplakette ergänzen.
- [x] Browserregressionen für alle Aufgabenarten, UTF-8-Fehler, Unicode-Navigation und schnelle Basiswechsel durchführen.
- [x] Mobile Darstellung bei 360 Pixeln ohne Seiten-/Dialogüberlauf prüfen; Tabellen scrollen intern.
- [x] Einstellungstext in beiden Farbschemata mit mindestens 4,5:1 Kontrast prüfen (5,10:1 bzw. 5,27:1).
- [x] Slider-/Backdrop-Verhalten, 64-Bit-Genauigkeit, Padding und rein lokalen Betrieb erneut prüfen.

## Iteration 9: Stellenwertformeln und wiederverwendbarer Rechner

- [x] Stellenwertanzeigen um Potenzformeln ergänzen; auch Exponenten passend zur Zahlenbasis darstellen.
- [x] Unabhängiges Rechnermodul mit eigenem Overlay und separatem Stylesheet erstellen.
- [x] Rechenschaltfläche an manuellen Antwortfeldern für Ganzzahlen und UTF-8-Codepoints ergänzen.
- [x] Formeleingabe mit Fokus, Operator-Schaltflächen, Cursor-/Auswahlersetzung und Live-Ergebnis bereitstellen.
- [x] Leerzeichen, Multiplikations-/Divisionsvarianten, Kommas und Potenzschreibweise normalisieren.
- [x] Brüche exakt berechnen; nichtnegative ganze Ergebnisse ohne automatische Aufgabenprüfung übernehmen.
- [x] Basis werttreu mit Aufgabe koppeln; Formeln einschließlich Exponenten umrechnen.
- [x] Ungültige/unvollständige Formeln mit `?`, Eingabefarbe und konkretem Fehler sichtbar machen.
- [x] Genaue 64-Bit-Rechnungen, exakte Brüche, Operatorrangfolge und Größenlimits testen (31 Testgruppen insgesamt).
- [x] Browserprüfungen für verschachtelte Overlays, UTF-8, gekoppelte Basis, Fokus und mobile Darstellung abschließen.
- [x] Unabhängige Rechnerinstanzen, Maus-/Auswahlersetzung, echte Validierungsfarben und explizite Umrechnungsfehler prüfen.

## Iteration 10: Inline-Rechner für alle numerischen Decodierschritte

- [x] Eigenständiges Rechner-Overlay durch Inline-Ansicht im Aufgabendialog ersetzen.
- [x] SVG-Rechnersymbol mit sichtbarem Label „Rechner“ verwenden.
- [x] Rohes Zahlen-/Codepoint-Feld vorübergehend ersetzen und bei Übernahme/Abbruch wiederherstellen.
- [x] Bits und vorhandene Stellenwerte sichtbar erhalten; gekoppelte Basis und Fokus bei Neudarstellung bewahren.
- [x] Rechts neben jedem Farbkanal-Slider Rechner anbieten; Ergebnis setzt Rohwert, Slider und Vorschau.
- [x] Pro Anwendung genau einen Rechner mit einem Rechenziel öffnen; Kanalwechsel verwirft nicht übernommene Rechnungen.
- [x] Kanalgrenzen für RGB/HSB/LAB, Graustufen und 1-Bit-Kanäle ausdrücklich prüfen.
- [x] Rechner neben Zeichen-Bitsequenz ergänzen; Ergebnis markiert nur den Code mit Hinweis zur manuellen Bestätigung.
- [x] Vorschläge blockweise erhalten, beim Basiswechsel korrekt darstellen und erst nach Anklicken prüfen.
- [x] 32 Logiktests sowie Browserprüfungen für Zahlen, Farben, Zeichen, UTF-8, Fokus und 360-Pixel-Darstellung durchführen.

## Iteration 11: Klarere Regler, Moduswahl und Aufgabenabschluss

- [x] Interaktiv als Standard setzen und den einzigen Modusschalter in den Kopfbereich verschieben.
- [x] Einstellungsleiste „Codierungseinstellungen“ nennen und den Modus dort entfernen.
- [x] Minimum/Maximum direkt am Kanalregler ausrichten; Rohwert rechts größer und Rechner daneben nur als Symbol anzeigen.
- [x] Nach dem letzten Block einen Hinweis mit Schließen-Control statt Weiter im Overlay anbieten.
- [x] UTF-8-Fehler beim Abschluss ausdrücklich nennen, statt vollständige erfolgreiche Decodierung zu behaupten.
- [x] Fortschrittsanzeige um „Blöcke“ ergänzen und lange Überschriften mobil umbrechen.
- [x] Offene Blöcke visuell deutlicher absetzen; Weiter nur an tatsächlich decodierten Blöcken anzeigen.
- [x] Rücksetz-Hinweis nach erster Informationsinteraktion ausblenden.
- [x] 32 Logiktests sowie Browserprüfungen für Moduswahl, Abschluss/Fokus, Hinweisverhalten, Kanalgeometrie, Basiswechsel und mobile Graustufen durchführen.

## Iteration 12: CMY und Ganzzahlen mit Vorzeichen

- [x] Hauptauswahl „Was wird Codiert?“ nennen und UTF-8 mit „(Erweiterung)“ kennzeichnen.
- [x] „Ganzzahlen mit Vorzeichen (Erweiterung)“ mit denselben Blockgrößen und exakter 64-Bit-Interpretation ergänzen.
- [x] Negativen höchsten Stellenwert in Formel, Tabelle und Summe darstellen.
- [x] Negative Dez/Hex-Antworten, Basiswechsel und Rechnerübernahme auf vorzeichenbehaftete Aufgaben abstimmen.
- [x] Bestehendes Null-Padding und nichtnegative Ergebnisgrenzen anderer Aufgaben beibehalten.
- [x] CMY mit komplementärer RGB-Anzeige, eigenen Kanalgradienten und unveränderter Graustufenregel ergänzen.
- [x] 39 Logiktests einschließlich Grenzwerten, vollständigen kleinen Bitmustern und allen CMY-Farbtiefen durchführen.
- [x] Browserprüfungen für CMY, negative Rechnerübernahme, beide Modi und mobile Darstellung abschließen.

## Iteration 13: Einzelblock-Layout und offener Status

- [x] „Noch zu decodieren“ als kräftigen roten Text ohne buttonartige Umrandung, Hintergrund oder Innenabstand darstellen.
- [x] Einen einzelnen Block in beiden Modi über die gesamte Informationsbreite anzeigen.
- [x] Fortschrittszähler bei einem einzelnen Block ausblenden; separate UTF-8-Fehlermeldungen beibehalten.
- [x] Mehrfachblock-Layout und Fortschrittsanzeige unverändert erhalten, auch beim Wechsel der Daten oder Blockgröße.
- [x] 39 Logiktests sowie Browserprüfungen für offene/gelöste Blöcke, UTF-8, Fehler und beide Modi bei 360 Pixeln durchführen.

## Iteration 14: Kompakte Erklärungen und direkte Unicode-Auswahl

- [x] Ganzzahlen mit Vorzeichen an das Ende der Hauptauswahl verschieben.
- [x] Padding-Hinweis um die Auffüllregel ergänzen und im interaktiven Modus samt Padding-Bits blass hellblau statt akzentähnlich darstellen.
- [x] Decodierte Ergebnisse fett anzeigen.
- [x] Stellenwertzellen zweizeilig darstellen: Potenzformel oben, Wert mit Basis unten; Vorzeichen und Dez/Hex erhalten.
- [x] Unicode-Raster im manuellen Modus anklickbar machen: Wert eintragen und markieren, aber erst über Prüfen bestätigen.
- [x] Responsives Raster ohne eigene Scrollfläche verwenden; Eingabe darunter und Prüfen am unteren Overlay-Rand sichtbar halten.
- [x] Beim Öffnen des Bereichs und bei einer Auswahl ausschließlich das ganze Overlay zu Eingabe/Prüfung scrollen.
- [x] Anzeigen-Button entfernen; Enter, Ausrichtung auf 128er-Seiten und knappe Bereichserklärung beibehalten.
- [x] 39 Logiktests sowie Browserprüfungen für Auswahl, Rechnerabbruch, Basiswechsel, Seiten-/Surrogatgrenzen, ASCII und mobile Geometrie durchführen.

## Zurückgestellt

- [ ] ? Symboltabelle / „Pseudo-Wingdings“: Bedarf später klären; gegebenenfalls feste Unicode-Belegung statt vorausgesetzter Wingdings-Schrift.

## Später: Fortgeschrittene Codierungen

- [ ] Erweiterungsumfang separat abstimmen.
- [ ] Wähler für einfache/fortgeschrittene Codierungen ergänzen.
- [x] Zweierkomplement mit Details und interaktiven Aufgaben ergänzen (Iteration 12).
- [ ] Festkommazahlen ergänzen: Aufteilung in Ganzzahl-/Nachkommabits, Skalierung und Vorzeichen festlegen; Stellenwerte und Interpretation sichtbar machen.
- [ ] Fließkommazahlen ergänzen: Formate (beispielsweise IEEE 754), Vorzeichen, Exponent, Mantisse, Rundung und Sonderwerte spezifizieren und darstellen.
- [ ] Beide Modi und passende Grenzfalltests für jede neue Codierung bereitstellen.

## Geplant: UTF-Oberfläche überarbeiten

- [ ] Oberfläche der UTF-Decodierung überarbeiten: Zusammenhang zwischen Präfixen, Nutzbits, Codepoint und Zeichen übersichtlicher und interaktiv nachvollziehbar darstellen.
  - [x] Erster Bedienungsschritt: direkte Unicode-Auswahl, responsives Raster und Overlay-Scrolling (Iteration 14).
- [ ] Automatische Erklärung und manuelle Aufgabe aufeinander abstimmen; gezielte Hilfen statt zusätzlicher Textfülle.
- [ ] ? UTF-16 ergänzen: Bedarf und Umfang klären, gegebenenfalls Codeeinheiten, Surrogatpaare und Byte-Reihenfolge spezifizieren.

## Geplant: Eigene Übungsseite

- [ ] Separate, vollständig lokal nutzbare Übungsseite mit auswählbaren, vorgegebenen Aufgabenstellungen anlegen.
- [ ] Jede Aufgabe auf einen einzelnen Block begrenzen; Codierung und erforderliche Parameter eindeutig vorgeben.
- [ ] Aufgaben in beide Richtungen anbieten: Daten interpretieren und zu einer vorgegebenen Information passende Daten bestimmen.
- [ ] Rückwärtsaufgaben aufnehmen, beispielsweise: „Welche 8 Bits repräsentieren ein A in der ASCII-Zeichencodierung?“
- [ ] Antworten je nach Aufgabe manuell eingeben oder gezielt anklicken lassen, beispielsweise die richtige von vier gegebenen Farben.
- [ ] Antworten prüfen und gezieltes Feedback geben, ohne die Lösung vor der eigenen Bearbeitung zu verraten.
- [ ] Hilfsmittel optional zuschaltbar machen, insbesondere Rechner und die gesamte Visualisierer-Oberfläche.
- [ ] Hilfsmittel dienen nur zur Herleitung: keine automatische Ergebnisübernahme in die Übungsantwort; Antwort weiterhin selbst eingeben bzw. auswählen.
- [ ] Nutzung ohne Hilfsmittel als Prüfungsvorbereitung ermöglichen; dieselben einfachen Aufgabentypen sollen auch ohne Tools lösbar sein.
- [ ] Bestehende Decodierungslogik und wiederverwendbare Module nutzen, ohne die Übungsantwort durch eingeblendete Hilfen automatisch zu bestätigen.
- [ ] Aufgabenauswahl, Vorwärts-/Rückwärtsrichtung, Eingabeformen, optionale Hilfen und Prüfung der Antworten testen.

## Geplant: Zeit-Challenges für geeignete Aufgaben

- [ ] Challenge-Modi für geeignete Einzelblock-Aufgaben vorsehen, insbesondere Binär → Dezimal, Dezimal → Binär und Farben raten.
- [ ] Pro Runde mehrere zufällig gewählte Aufgaben ohne Hilfsmittel möglichst schnell lösen lassen.
- [ ] Zeitmessung und Auswertung von Korrektheit und benötigter Zeit vollständig lokal umsetzen.
- [ ] ? Platzierung klären: unabhängig von der Übungsseite oder als integrierter Challenge-Modus.
- [ ] ? Rundenumfang festlegen: zunächst etwa fünf Aufgaben als Vorschlag.
- [ ] ? Schwierigkeitsverlauf klären: gleichbleibend oder innerhalb einer Runde zunehmend; geeignete Wertebereiche und Farbauswahlen festlegen.
- [ ] ? Umgang mit falschen Antworten festlegen, etwa erneuter Versuch, Zeitstrafe oder getrennte Fehlerwertung.
- [ ] Zufallsauswahl, eindeutige Lösungen, ausgeschlossene Hilfsmittel sowie Start, Ende und Neustart der Zeitmessung testen.
