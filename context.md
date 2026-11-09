# Projektkontext: Interaktiver Bit- und Codierungsvisualisierer

## Ziel

Eine interaktive Lernanwendung zeigt, wie dieselbe Bitfolge je nach Codierung unterschiedlich interpretiert wird. Neben der direkten Interpretation macht ein interaktiver Modus die Decodierung schrittweise nachvollziehbar.

Die Umsetzung erfolgt bewusst einfach und iterativ. Die erste Version legt eine erweiterbare Grundlage; weitere Modi und Codierungen werden ohne grundlegende Umgestaltung ergänzt.

## Technische Rahmenbedingungen

- Statische Webseite mit HTML, CSS und lokalem JavaScript.
- Vollständig clientseitig, ohne Backend, Datenbank, externe Dienste oder Serverkommunikation.
- Keine extern geladenen Schriften, Bibliotheken oder anderen Ressourcen erforderlich.
- Maximal 64 ursprünglich eingegebene Bits; interpretatives Padding darf diese Grenze überschreiten.
- Große Ganzzahlen werden verlustfrei verarbeitet, insbesondere mit JavaScript `BigInt`.
- Trennung von Decodierungslogik, Oberfläche und interaktiven Lernschritten.
- Neue Codierungen lassen sich modular ergänzen.
- Responsive, übersichtliche und zugängliche Oberfläche.
- Oberfläche und didaktische Erklärungen auf Deutsch.

## Oberfläche

Untertitel: **Von Daten zu Informationen**.

### Modus

Im Kopfbereich steht ausschließlich der Modusschalter **Automatisch** / **Interaktiv**; **Interaktiv ist der Standard**. Die darunterliegende Leiste heißt **Codierungseinstellungen** und enthält nur Codierung und fachliche Parameter. Der Seitentitel selbst schaltet den Modus nicht um. Die beiden großen Hauptbereiche sind **Daten** und **Informationen**.

Die Moduswahl ist ein Dez/Hex-ähnlicher Schalter. Automatisch verwendet ein blaues, Interaktiv ein oranges Farbschema für die gesamte Seite einschließlich Einstellungen, Panels, Blöcken und Overlay. Das deutlich hervorgehobene aktive Schalterlabel ergänzt die Farbe; eine zusätzliche Modusplakette entfällt. Decodierte Farben behalten ihre tatsächlichen Farbwerte.

### Daten

Eingabefeld mit Label **Daten**:

- Folge ausschließlich aus `0` und `1`, höchstens 64 Bit.
- Sichtbare Validierung ohne stillschweigendes Verändern ungültiger Eingaben.
- Im automatischen Modus werden gültige Änderungen unmittelbar übernommen.
- Die ursprüngliche Eingabe bleibt durch Padding unverändert.
- **Beispiel laden** bietet zwölf unbenannte Bitfolgen von 1 bis 64 Bit; die Auswahl übernimmt die Folge unverändert. Bei eigener Eingabe wird die Auswahl zurückgesetzt.

### Informationen

- Bitblöcke mit deutlich erkennbaren Grenzen.
- Decodierte Werte direkt bei ihrem jeweiligen Block.
- Anfangs wird der rechte Block hervorgehoben, danach der zuletzt verwendete Block.
- Keine Blockauswahl und keine Pfeilnavigation erforderlich.
- Bei jedem decodierten Block öffnet **?** direkt das Detail-Overlay.
- Bei jedem ungelösten Block stehen **Manuell** und **Automatisch**.
- Offene Blöcke sind gestrichelt umrandet und hinterlegt; ihr Status **Noch zu decodieren** erscheint als kräftiger roter Text ohne buttonartigen Rahmen oder Hintergrund. Decodierte Blöcke haben einen kräftigen, durchgezogenen linken Akzent. Offene und fehlerhafte Blöcke erhalten keine **Weiter**-Control.
- Ein einzelner Block nutzt die gesamte Breite im Informationsbereich, unabhängig von Modus, Codierung oder Decodierstatus. Dann entfällt die Fortschrittsanzeige; separate UTF-8-Fehlermeldungen bleiben sichtbar.
- Bei mehreren Blöcken bleiben Anordnung und Fortschritt wie bisher: beispielsweise **1 / 2 Blöcke decodiert**, zusätzlich zu eventuell vorhandenen UTF-8-Fehlern. Lange Kopfzeilen dürfen auf schmalen Bildschirmen umbrechen.
- Der Rücksetz-Hinweis nach geänderten Daten/Parametern verschwindet bei der ersten Klick-, Tastatur- oder Eingabeinteraktion im Informationsbereich oder Aufgabendialog.
- Nach dem letzten decodierbaren Block ersetzt ein Abschluss mit **Schließen** die Weiter-Control im Overlay. Ungültige UTF-8-Folgen werden dabei ausdrücklich genannt, nicht als erfolgreich decodiert dargestellt.
- Blöcke enthalten nur Bits, Ergebnis und Controls. Tabellenindizes, Kanalwerte und Erklärungen stehen ausschließlich im Overlay.
- Dreikanal-Farben erhalten Abstände zwischen den Kanalgruppen; Graustufen nicht.

## Einfache Codierungen

### Positive Ganzzahlen

- Vorzeichenlose Interpretation; auch der Wert null ist darstellbar.
- Standard: 8 Bit je Zahl.
- Wählbare Blockgrößen: 1 bis 8 sowie 16, 32 und 64 Bit.
- Ausgabe ohne Genauigkeitsverlust.
- Details: Bits, binäre Stellenwerte und Summe der aktiven Stellenwerte.
- Stellenwerte erscheinen als Potenzformel und Wert, beispielsweise 2⁷ = 128₁₀. Auch Exponenten folgen dem Basisschalter, damit die Formel direkt in den Rechner passt: 2ᴬ = 400₁₆ entspricht 2¹⁰ = 1024₁₀.

### Ganzzahlen mit Vorzeichen (Erweiterung)

- Gleiche Blockgrößen wie bei positiven Ganzzahlen, standardmäßig 8 Bit.
- Zweierkomplement: Der höchste Stellenwert ist negativ, alle übrigen sind positiv. Beispiel: −2⁷ + 2⁶ + 1 = −63 bei `11000001`.
- Wertebereich bei n Bit: −2ⁿ⁻¹ bis 2ⁿ⁻¹−1, auch bei 64 Bit exakt mit `BigInt`. Ein Bit stellt −1 oder 0 dar.
- Automatische Ausgabe und manuelle Aufgaben nutzen dieselbe Stellenwerttabelle; der negative Stellenwert ist zusätzlich farblich hervorgehoben.
- Negative Antworten und Rechnerübernahmen funktionieren in beiden Zahlenbasen. Hexwerte sind mathematische Werte mit Minus, etwa `-80` für −128, nicht das vorzeichenlos gelesene Bitmuster.
- Padding bleibt linksseitiges Null-Padding, keine Vorzeichenerweiterung. Maßgeblich ist das erste Bit des vollständigen Blocks.

### Zeichen

- ASCII und nationale Lerntabellen: 8 Bit je Zeichen.
- Zusätzlich UTF-8: variable Blöcke von ein bis vier Bytes je Unicode-Codepoint; im Dropdown als **(Erweiterung)** gekennzeichnet.
- Standardtabelle: ASCII in der ersten Tabellenhälfte, also Indizes 0 bis 127.
- Zweite Tabellenhälfte (erstes Bit `1`, Indizes 128 bis 255) ist im Standard leer/unbelegt.
- Deutsche Variante mit Umlauten und weiteren passenden Zeichen in der zweiten Hälfte.
- Polnische und kyrillische Varianten mit deutlich unterschiedlichen Belegungen in der zweiten Hälfte.
- Höchstens drei Sprach-/Schriftvarianten; keine nahezu identischen separaten französischen/spanischen Listen.
- Die konkreten Tabellen sind eindeutig zu dokumentieren. ASCII selbst ist eine 7-Bit-Codierung; eine leere zweite Hälfte ist keine standardisierte 8-Bit-Erweiterung.
- Steuerzeichen und unbelegte Einträge müssen verständlich und eindeutig dargestellt werden.
- Details: Erklärung der ausgewählten Tabelle, vollständige Zeichentabelle, hervorgehobener Index und resultierendes Zeichen.

Aktuelle Tabellen: ASCII zuerst (0–127), danach die zweite Hälfte (128–255). Deutsch verwendet die zweite Hälfte von Windows-1252, Polnisch die von Windows-1250 und Kyrillisch die von Windows-1251. Sie werden ausdrücklich als Lernerweiterungen bezeichnet. Die kyrillische Tabelle deckt mehrere Sprachen ab. Undefinierte Positionen bleiben unbelegt. Steuerzeichen werden benannt (z. B. NUL, LF), Leerzeichen als SP dargestellt.

### Farben

- Standard: RGB mit 24 Bit.
- Wählbare Farbtiefe: jede ganze Zahl von 1 bis 24 Bit pro Farbe.
- Durch drei teilbare Farbtiefen: drei gleich große Farbkanäle.
- Andere Farbtiefen: Graustufeninterpretation des gesamten Blocks.
- Wählbare Farbräume: RGB, CMY, HSB und LAB.
- Details: Kanalaufteilung, numerische Kanalwerte, Anteil der Kanäle und resultierende Farbe.

Primär erscheinen immer Rohwerte in der gewählten Zahlenbasis und Balken. Bei n Bit sind 2ⁿ verschiedene Werte darstellbar: 0 bis 2ⁿ−1. Balken zeigen den Anteil am maximalen Rohwert. Zusätzliche physikalische Werte sind nur Hinweise.

Kanalbalken und Slider unterstützen die Farbrauminterpretation auch farblich:

- CMY: Weiß nach Cyan, Magenta bzw. Gelb; die Reglerfarbe folgt dem jeweiligen Farbauftrag.
- HSB: H zeigt das Farbspektrum mit der gewählten Hue-Farbe. S verläuft von Weiß zum gewählten Hue und passt seine Farbe der Sättigung an. B verläuft von Schwarz zur H/S-Farbe und folgt der gewählten Helligkeit.
- LAB: L verläuft von Schwarz nach Weiß, a von Grün über neutral zu Rot/Rosa, b von Blau über neutral zu Gelb. Diese Achsendarstellungen sind bewusst grobe Lernhilfen, keine zusätzlichen exakten LAB-Umrechnungen.
- Änderungen an H/S/B aktualisieren abhängige Balkenfarben unmittelbar, ohne den Slider während des Ziehens neu anzulegen.

Für die Farbanzeige werden Rohwerte linear abgebildet:

- RGB: 0 bis 255 je Kanal.
- Idealisiertes CMY: C, M und Y linear von keinem bis vollem Farbauftrag; RGB = 1 − CMY bei normierten Kanälen. Alle Rohwerte 0 ergeben Weiß, alle maximalen Rohwerte Schwarz. Keine Druckprofile oder zusätzliche Schwarzkomponente.
- HSB: H 0 bis 360° (360° entspricht 0°), S und B 0 bis 100 %.
- CIELAB mit D65: L* 0 bis 100, a* und b* −128 bis 127.
- LAB-Farben außerhalb von sRGB werden für die Anzeige begrenzt und sichtbar gekennzeichnet.
- Graustufen sind farbraumunabhängig, linear von Schwarz bis Weiß; die Farbraumauswahl ist dann deaktiviert.

### Wahrheitswerte

- 1 Bit pro Wahrheitswert.
- Standard: `0` entspricht Falsch, `1` entspricht Wahr.
- Details: Erklärung der binären Darstellung und Zuordnung beider Bits.
- Eine Einstellung erlaubt das Vertauschen der Zuordnung von 0 und 1.

## Padding und Blockstruktur

Bei nicht durch die Blockgröße teilbarer Eingabelänge werden vor der gesamten Bitfolge so viele Nullen ergänzt, bis vollständige Blöcke entstehen.

Bei UTF-8 gilt diese Regel nur für vollständige Bytes (8 Bit), nicht für mehrbyteige Codepoints. Fehlende Fortsetzungsbytes sind Fehler und werden nie ergänzt.

- Padding nur für die Interpretation, nie als Änderung des Eingabefelds.
- Ergänzte Nullen sind visuell von Originalbits unterscheidbar und kurz erklärt.
- Der knappe Hinweis „Padding: … Nullen links ergänzt.“ erscheint nur bei tatsächlichem Padding.
- Padding-Nullen zählen bei der Decodierung wie reguläre Nullen.
- Die 64-Bit-Grenze gilt ausschließlich für Originaldaten. Beispielsweise ergeben 64 Eingabebits bei 24 Bit pro Block nach Padding 72 Interpretationsbits.
- Jeder Block bleibt seinem Ergebnis eindeutig zugeordnet.

## Zahlenbasis in Erklärungen

- Standardmäßig Dezimalzahlen, insbesondere für Tabellenindizes, Stellenwerte und Farbkanalwerte.
- Dez/Hex-Schalter im Detail- und Aufgaben-Overlay, kein Dropdown.
- Die Auswahl bleibt für weitere Blöcke und beide Modi erhalten, solange die Seite geöffnet ist.
- Relevante Werte erhalten die Basis als tiefgestellten Suffix, beispielsweise 75₁₀ oder 4B₁₆.
- Bitfolgen bleiben binär; deren Darstellung muss eindeutig von erklärenden Zahlen unterschieden sein.
- Der Schalter gilt gemeinsam für Ergebniswerte, Erklärungen, Tabellenindizes und numerische Antwortfelder.
- Hexadezimalwerte ohne `0x`, mit A–F; die Basis steht auch am Antwortfeld.
- Bitanzahl und Blocknummern bleiben normale UI-Zählwerte.
- Basiswechsel erhält den Lernfortschritt; gültige numerische Antwortentwürfe werden in die neue Basis umgerechnet.

## Automatischer Modus

1. Gültige Eingabe entsprechend der aktuellen Einstellungen links auffüllen und aufteilen.
2. Alle Blöcke unmittelbar decodieren.
3. Bitblöcke und Ergebnisse gemeinsam anzeigen.
4. Über **?** an einem beliebigen Block direkt dessen Details öffnen.

Ein Wechsel der Codierung interpretiert dieselben ursprünglichen Daten neu.

## Inline-Rechner für manuelle Aufgaben

Schaltflächen mit einem lokalen SVG-Rechnersymbol und dem Label **Rechner** öffnen den Rechner direkt in der Aufgabenansicht, nicht als zusätzliches Overlay. Bits und vorhandene Stellenwerttabellen bleiben sichtbar; der Fokus liegt sofort im Formelfeld. Es ist immer nur ein Rechner geöffnet.

- Ganzzahlen und UTF-8-Codepoints: Der Rechner ersetzt vorübergehend das rohe Antwortfeld.
- Farben: Minimum/Maximum stehen unmittelbar unter dem Kanal-Slider bzw. Balken; rechts davon steht der eingestellte Rohwert vergrößert, daneben die Rechner-Schaltfläche nur als Symbol mit zugänglicher Beschriftung. Der Rechner erscheint direkt beim gewählten Kanal. Das Ergebnis setzt den Slider und aktualisiert Rohwert, Kanalgradienten und Farbvorschau. Der zulässige Kanalbereich wird geprüft, nicht stillschweigend begrenzt; das gilt auch für Graustufen und kleine Farbtiefen.
- Zeichentabellen: Der Rechner steht neben der Bitsequenz. Übernahme markiert den berechneten Code, wählt ihn aber noch nicht aus. Ein Hinweis **„Code … markiert · zum Prüfen anklicken.“** fordert die manuelle Bestätigung. Erst dieser Klick prüft die Antwort. Markierungen bleiben pro Block und beim Basiswechsel erhalten.
- Beim Wechsel zu einem anderen Kanal wird die vorherige Rechnung ohne Übernahme geschlossen. Übernahme, Schließen und Escape stellen die normale Aufgabenansicht wieder her; Escape schließt dabei nicht den Aufgabendialog.

- Grundrechenarten, `^` für Potenzen und Klammern; Operatoren lassen sich an der Cursorposition einfügen oder ersetzen eine Auswahl.
- Punkt vor Strich, rechtsassoziative Potenzen und mathematische Vorzeichenbindung: `2^3^2 = 512`, `-2^2 = -4`.
- Leerzeichen werden entfernt; `x`, `X`, `×`, `·` werden zu `*`, `÷` und `:` zu `/`, `**` zu `^`, Dezimalkommas zu Punkten und kleine Hexbuchstaben zu Großbuchstaben.
- Live-Ergebnis ohne Prüfbutton. Unvollständige/ungültige Ausdrücke zeigen `?`, ein rot markiertes Eingabefeld und einen gezielten Fehlerhinweis. Gültige Rechnungen werden grün markiert.
- Exakte Ganzzahl-/Bruchrechnung mit `BigInt`, auch jenseits der sicheren JavaScript-`Number`-Grenze. Endliche Brüche erscheinen in der gewählten Basis als Kommazahlen; periodische oder mehr als 128 Nachkommastellen lange Darstellungen bleiben exakte Brüche.
- Nur ganze Ergebnisse können übernommen werden. Negative Ergebnisse sind ausschließlich bei Ganzzahlen mit Vorzeichen erlaubt; die anderen Aufgaben bleiben nichtnegativ. Brüche und negative Zwischen-/Endergebnisse bleiben überall berechenbar und sichtbar; eine deaktivierte Übernahme wird erklärt.
- Der Dez/Hex-Schalter ist mit dem Aufgabendialog gekoppelt. Sämtliche Literale einschließlich Exponenten werden in der gewählten Basis interpretiert. Beim Wechsel werden sie werttreu umgerechnet, auch in unvollständigen Formeln. Nicht endlich darstellbare Literale werden zu geklammerten Brüchen, etwa `0.1` → `(1/A)`.
- Bei nicht umrechenbarer fehlerhafter Eingabe bleibt die Formel erhalten; ein ausdrücklicher Hinweis meldet die fehlgeschlagene Umrechnung.
- **Ergebnis übernehmen** (oder Enter im Formelfeld bei übernehmbarem Ergebnis) überträgt den Wert ohne automatische Aufgabenprüfung, schließt den Inline-Rechner und fokussiert Antwortfeld, Kanal-Slider oder markierten Zeichencode.
- Escape oder Schließen verwirft die Rechnung und lässt die Antwort unverändert. Erneutes Öffnen startet mit der aktuellen Antwort.
- Eingabe höchstens 512 Zeichen, höchstens 64 verschachtelte Rechenschritte, ganzzahlige Exponenten mit Betrag bis 4096 und Ergebnisse mit höchstens 8192 Bit je Zähler/Nenner. Überschreitungen werden ausdrücklich gemeldet; keine dynamische Codeausführung.

### Wiederverwendung

[calculator.js](./calculator.js) und [calculator.css](./calculator.css) sind unabhängig von der Decodierungs- und Lernlogik. Das Stylesheet verwendet die Seitenfarbvariablen mit eigenen Ersatzwerten.

`BitCalculator.createCalculator({ base, onBaseChange, onAccept, onClose })` erzeugt einen Inline-Bereich mit eigener Radio-Gruppe. `open(container, expression, maximum, allowNegative)` hängt ihn in einen vorhandenen Container ein; die optionale Obergrenze ist eine nichtnegative `BigInt`-Zahl. `allowNegative` erlaubt bei `true` negative Ganzzahlübernahmen und ist standardmäßig `false`; die Anwendung aktiviert es ausschließlich für vorzeichenbehaftete Ganzzahlen. `mount(container)` versetzt denselben Rechner bei DOM-Neudarstellung, ohne die Rechnung zu verlieren. `setBase(base)`, `close()` und `destroy()` steuern die Instanz. `onBaseChange` koppelt andere Oberflächen; `setBase` löst diesen Callback nicht erneut aus. `onAccept` erhält den Ergebnistext in der gewählten Basis vor dem Schließen; der optionale `onClose`-Callback stellt die normale Aufgabenansicht wieder her. Die Anwendung verwendet eine Instanz mit jeweils genau einem Rechenziel.

`evaluate(expression, base)` und `convertExpression(expression, from, to)` sind ohne DOM als CommonJS-Export testbar. Ungültige Formeln liefern einen ausdrücklichen Fehlerzustand; Programmierfehler werden nicht verschluckt.

## Interaktiver Modus

Die Aufteilung folgt automatisch den Codierungseinstellungen. Der frühere Aufteilungs-Schritt, die feste Reihenfolge von rechts nach links und verpflichtende Weiter-/Gesamtergebnis-Schritte entfallen.

Jeder ungelöste Block zeigt **Noch zu decodieren** und zwei direkte Aktionen:

- **Manuell** öffnet die Aufgabe für diesen Block im Overlay.
- **Automatisch** decodiert ausschließlich diesen Block.

Die Blöcke können in beliebiger Reihenfolge bearbeitet werden. Nach erfolgreicher Prüfung oder Automatisierung erscheinen Ergebnis und Fragezeichen; die beiden Lerncontrols entfallen für diesen Block. Bei mehreren Blöcken zeigt ein knapper Zähler den Fortschritt.

Solange weitere Blöcke offen sind, erscheint bei gelösten Blöcken **Weiter →** und in ihrer Erklärung **Nächster offener Block →**. Beide öffnen direkt die nächste manuelle Aufgabe. Die Suche folgt der sichtbaren Reihenfolge von links nach rechts, überspringt gelöste Blöcke und beginnt am Ende wieder links. Sobald alle gelöst sind, entfallen diese Controls. Der Sprung ist optional.

Manuelle Aufgaben mit kurzer Hilfestellung:

- Ganzzahlen: Wert in Dezimal oder Hex eingeben; das Stellenwertschema steht oben, ohne die fertige Summe vorwegzunehmen.
- Zeichen: passenden Eintrag in der vollständigen Tabelle auswählen, einschließlich unbelegter Positionen. Jeder Klick prüft unmittelbar.
- Farben: drei Kanalbalken per Slider auf die Rohwerte einstellen, bei Graustufen einen Slider. Werte und Grenzwerte folgen der gewählten Basis. Pfeiltasten ändern um einen Rohwert, Home/End setzen Minimum/Maximum. Die Vorschau zeigt ausschließlich die selbst eingestellte Farbe.
- Wahrheitswerte: Schwarz/Weiß-Schalter für Falsch/Wahr; jeder Toggle prüft unmittelbar. Die eingestellte Bitzuordnung bleibt als knapper Hinweis sichtbar.

Ganzzahlen, UTF-8-Codepoints und Farben behalten einen ausdrücklichen **Prüfen**-Button. Farb-Slider lösen beim Verschieben keine Prüfung aus.

Falsche Antworten geben gezieltes Feedback. Richtige Antworten lösen den Block und wechseln innerhalb desselben Overlays zur Erklärung. Schließen gibt den Tastaturfokus an das passende Block-Control zurück.

Ein Backdrop-Klick schließt das Overlay nur, wenn dieselbe Pointer-Geste außerhalb beginnt und endet. Das Loslassen eines im Dialog gestarteten Slider-Drags außerhalb oder eine abgebrochene Pointer-Geste schließt es nicht. Schließen-Button und Escape bleiben verfügbar.

Entwürfe bleiben beim Schließen und beim Bearbeiten anderer Blöcke erhalten. Basiswechsel erhält Fortschritt, umgerechnete Ganzzahlentwürfe, Farb-Rohwerte, Zeichenauswahl und Tabellen-Scrollposition. Änderungen an Daten, Codierung oder fachlichen Parametern setzen die Decodierung zurück; verlorener Fortschritt oder Entwürfe werden knapp gemeldet. Leere Eingabe ist ein neutraler Zustand ohne Blöcke.

## UTF-8 und zurückgestellte Symboltabelle

### Symbole statt einer fontabhängigen Wingdings-Tabelle

Wingdings ist eine spezielle Schrift mit eigener Belegung und nicht überall verfügbar. Für die weiterhin offline nutzbare Lernanwendung wird stattdessen eine ausdrücklich selbst definierte 8-Bit-Symboltabelle empfohlen: ASCII zuerst, in der zweiten Hälfte feste Zuordnungen zu Unicode-Symbolen wie Pfeilen, geometrischen Formen und Schachfiguren. Die tatsächliche Darstellung erfolgt mit den lokal verfügbaren Browser-Schriften. Das wäre keine Wingdings-kompatible Tabelle; eine genaue Wingdings-Darstellung würde eine festgelegte Belegung und eine rechtmäßig nutzbare passende Schrift erfordern.

**Zurückgestellt (?)**: Ob eine solche Symboltabelle benötigt wird, bleibt offen. Sie wird vorerst nicht umgesetzt.

### UTF-8 als variable Zeicheninterpretation

UTF-8 ist keine weitere feste 8-Bit-Tabelle. Ein Unicode-Codepoint belegt ein bis vier Bytes. Die vorhandene maximale Eingabe von 64 Bit entspricht bis zu acht Bytes.

Das Präfix des ersten Bytes bestimmt die Blocklänge:

| Präfix / Bytefolge | Länge | Nutzbits |
| --- | --- | --- |
| `0xxxxxxx` | 8 Bit | 7 |
| `110xxxxx 10xxxxxx` | 16 Bit | 11 |
| `1110xxxx 10xxxxxx 10xxxxxx` | 24 Bit | 16 |
| `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx` | 32 Bit | 21 |

Die Präfixmuster gelten nur zusammen mit den Gültigkeitsregeln aus [RFC 3629](https://www.rfc-editor.org/rfc/rfc3629). Insbesondere sind `C0`, `C1` und `F5`–`FF` keine gültigen Startbytes.

Implementierter Ablauf:

1. Die ursprüngliche Eingabe wie bisher bei Bedarf links mit sichtbaren Nullen auf vollständige Bytes ergänzen.
2. Von links nach rechts das Startbyte lesen, die erwartete Bytezahl bestimmen und passende `10`-Fortsetzungsbytes zum selben Block zusammenfassen.
3. Präfixbits und Nutzbits unterschiedlich kennzeichnen; Bytegrenzen innerhalb eines Codepoint-Blocks sichtbar lassen.
4. Die `x`-Bits in ihrer Reihenfolge zusammenfügen und als vorzeichenlosen Unicode-Codepoint interpretieren.
5. Das Zeichen lokal mit `String.fromCodePoint(codePoint)` darstellen. Es erfolgt kein Netzwerkzugriff auf eine Unicode-Datenbank.

Beispiel: `110|00011 10|100100` → Nutzbits `00011100100` → 228 (dezimal), E4 (hexadezimal), `U+00E4` → ä.

`Aä😀` benötigt sieben Bytes bzw. 56 Bit und ergibt Codepoint-Blöcke von 8, 16 und 32 Bit. Der Unicode-Identifier `U+…` ist stets hexadezimal; die zusätzlichen numerischen Werte folgen dem vorhandenen Dez/Hex-Schalter.

### Overlay und Interaktion

- Automatisch: fertige Zeichen direkt bei ihren variablen Blöcken.
- Erklärung: Bytepräfixe → Nutzbits → Codepoint → Zeichen, ohne lange Zusatztexte.
- Manuell: die Nutzbits als Codepoint in Dezimal/Hex eingeben; nach erfolgreicher Prüfung das Zeichen und dessen `U+…`-Identifier zeigen.
- Unicode-Ansicht als aufklappbares, lokal erzeugtes Raster mit 128 Positionen, Vor/Zurück und Eingabe eines Start-Codepoints in der gewählten Basis. Die Eingabe wird auf eine 128er-Seite ausgerichtet; gültiger Bereich: U+0000 bis U+10FFFF.
- Im Aufgabenmodus startet das Raster bei U+0000 und verrät weder das Zielzeichen noch dessen Position. Nach dem Lösen wird die Zielseite mit markiertem Codepoint angeboten.
- Surrogatpositionen erscheinen als reserviert statt als Zeichen. Steuer-/Formatzeichen werden lesbar benannt; kombinierende Zeichen erhalten einen gepunkteten Kreis.
- Namen, Sprachzugehörigkeit und andere Unicode-Metadaten sind nicht in `String.fromCodePoint` enthalten. Dafür wäre optional ein lokaler Datenausschnitt nötig; für die erste Umsetzung genügt Zeichen plus Codepoint.

### Fehler und Grenzen

- Fehlende/falsche Fortsetzungsbytes, überlange Folgen, Surrogate `U+D800`–`U+DFFF` und Werte über `U+10FFFF` sind sichtbar als Fehler zu markieren.
- Fehlende Fortsetzungsbytes niemals automatisch mit Padding erfinden.
- Keine stillschweigende Ersetzung durch �; ungültige Bereiche erhalten eine Fehleransicht statt eines scheinbar erfolgreich decodierten Zeichens.
- Die eigene Präfix-/Nutzbitlogik wird in Tests mit `TextDecoder("utf-8", { fatal: true, ignoreBOM: true })` abgeglichen. Ein vorhandener BOM bleibt als Daten-Codepoint erhalten.
- Fehlerblöcke sind keine lösbaren Aufgaben und zählen nicht als Lernfortschritt. Die Weiter-Funktion überspringt sie; Fehlerzahl und Detailansicht bleiben sichtbar.
- Ungültige Startbytes bilden einzelne Fehlerblöcke. Abgebrochene Folgen enthalten das Startbyte und vorhandene Fortsetzungsbytes; ein nachfolgendes Start-/ASCII-Byte bleibt für den nächsten Block erhalten. Kein Eingabebyte geht verloren.
- Nicht zugewiesene, aber gültige Unicode-Skalarwerte sind kein UTF-8-Strukturfehler. Fehlende Schriftzeichen sind als Darstellungsgrenze zu unterscheiden.
- Pro Block zunächst ein Codepoint, nicht zwingend ein wahrgenommenes Zeichen: kombinierende Akzente oder Emoji-Sequenzen können mehrere Blöcke umfassen.

### Architektur

Das Codierungsregister unterstützt optional eine eigene Segmentierung statt einer festen Blockgröße. Die vorhandene Aufteilung bleibt für alle bisherigen Codierungen unverändert. UTF-8 liefert dieselbe Blockstruktur mit zusätzlicher Byte-/Präfix-/Codepoint-Metadaten; die blockweisen Controls, Entwürfe und Weiter-Funktion werden weiterverwendet. Die bestehenden nationalen Tabellen bleiben unverändert.

## Spätere Erweiterungen

Erst später kommt oberhalb der Codierungsauswahl ein Wähler **Einfache Codierungen** (Standard) / **Fortgeschrittene Codierungen** hinzu.

Vorgesehen:

- Gemeinsame Gruppierung der Erweiterungen; vorzeichenbehaftete Ganzzahlen im Zweierkomplement sind bereits direkt auswählbar.
- Festkommazahlen mit sichtbarer Aufteilung in Ganzzahl-/Nachkommabits und nachvollziehbarer Skalierung; konkrete Formate und Vorzeichenregel noch festlegen.
- Fließkommazahlen, beispielsweise IEEE 754, mit Vorzeichen, Exponent, Mantisse, Rundung und Sonderwerten; konkrete Formate noch festlegen.
- Für jede Erweiterung beide Modi und passende Detailansichten.

Diese Funktionen sind nicht Bestandteil des ersten MVP.

### UTF-Decodierung

Die bestehende UTF-8-Oberfläche soll überarbeitet werden. Präfixe, Nutzbits, Codepoint und Zeichen sollen in Erklärung und manueller Bearbeitung übersichtlicher zusammenhängen, weiterhin mit knappen, gezielten Hilfen. UTF-16 ist eine mögliche zusätzliche Erweiterung, noch keine beschlossene Umsetzung; bei Aufnahme sind Codeeinheiten, Surrogatpaare und Byte-Reihenfolge zu klären.

### Eigene Übungsseite

Geplant ist eine separate, vollständig clientseitige Übungsseite mit auswählbaren, vorgegebenen Aufgabenstellungen. Jede Aufgabe behandelt genau einen Block mit eindeutig vorgegebener Codierung und den nötigen Parametern. Neben der Decodierung sind Rückwärtsaufgaben vorgesehen, beispielsweise die acht ASCII-Bits zum Zeichen A zu bestimmen.

Die Antwort wird selbst eingegeben oder bei passenden Aufgaben angeklickt, etwa durch Auswahl der richtigen von vier Farben. Prüfung und Feedback beziehen sich auf diese eigene Antwort. Optional lassen sich Hilfsmittel wie der Rechner oder die gesamte Visualisierer-Oberfläche zuschalten, um das Ergebnis herzuleiten. Anders als bei der Rechnerübernahme im bestehenden App-Aufgabendialog erfolgt keine automatische Übertragung in die Übungsantwort: Diese muss weiterhin selbst eingetragen bzw. ausgewählt werden.

Ziel ist der Übergang vom unterstützten Erarbeiten zum selbstständigen Lösen einfacher Prüfungsaufgaben ohne Tools. Die vorhandene Decodierungslogik und wiederverwendbare Module sollen genutzt werden; Übungsseite und bestehender interaktiver App-Modus bleiben dabei unterschiedliche Lernangebote.

### Zeit-Challenges

Für geeignete Aufgaben sind kurze Runden mit zufällig gewählten Einzelblock-Aufgaben ohne Hilfsmittel vorgesehen, insbesondere Binär → Dezimal, Dezimal → Binär und Farben raten. Ziel ist eine möglichst schnelle korrekte Bearbeitung; Zeit und Korrektheit werden lokal erfasst.

Offen bleiben die Einbindung als eigener Bereich oder als Modus der Übungsseite, die Rundengröße (Vorschlag: etwa fünf Aufgaben), eine mögliche Steigerung der Schwierigkeit und der Umgang mit falschen Antworten. Diese Punkte sind vor der Umsetzung abzustimmen, nicht als bereits festgelegte Regeln zu behandeln.

## Didaktische Leitlinien

- Zusammenhang zwischen Bitfolge, Codierung und Wert steht im Mittelpunkt.
- Dieselben Daten lassen sich unmittelbar verschieden interpretieren.
- Regeln, Padding und Rechenschritte werden sichtbar statt verborgen.
- Automatischer Modus dient dem Erkunden, interaktiver Modus dem eigenständigen Erarbeiten.
- Hilfestellung nimmt nicht die gesamte Übung vorweg.

## Bestätigter Betrieb

Die HTML-Datei lässt sich direkt ohne lokalen Webserver öffnen (`file://`). Dafür werden klassische lokale JavaScript-Dateien verwendet, deren Verantwortlichkeiten dennoch getrennt sind. Es sind keine weiteren fachlichen Entscheidungen für die ersten vier Iterationen offen.

## Implementierter Stand

Die ersten dreizehn Iterationen sind umgesetzt: automatischer und standardmäßig interaktiver Modus, direkte Blockdetails, blockweiser Lernmodus, die vereinbarten Parameter, UTF-8, gut unterscheidbare Modusfarbschemata sowie Stellenwertformeln und ein wiederverwendbarer Inline-Rechner für Zahlen, Farbkanäle und Zeichencodes. Die aktuelle Oberfläche ergänzt klarere Kanalregler, Blockzustände und einen ausdrücklichen Aufgabenabschluss sowie CMY und Ganzzahlen mit Vorzeichen. Einzelblöcke nutzen die volle Informationsbreite ohne Fortschrittszähler; offene Aufgaben erhalten einen roten Textstatus. UTF-Oberflächenüberarbeitung, Fest-/Fließkommazahlen, eine gemeinsame Erweiterungsgruppierung, Übungsseite und Zeit-Challenges sind geplante spätere Schritte. UTF-16 ist optional; die Symboltabelle bleibt zurückgestellt.

### Start und Bedienung

1. [index.html](./index.html) direkt in einem aktuellen Browser öffnen. Kein Build, keine Installation und kein Webserver nötig.
2. Bis zu 64 Bits eingeben oder eine der zwölf Folgen unter **Beispiel laden** wählen.
3. Unter **Was wird Codiert?** die Interpretation und Parameter wechseln, um dieselben Daten neu zu interpretieren.
4. Über **?** direkt die Erklärung eines decodierten Blocks öffnen; dort zwischen **Dez** und **Hex** umschalten.
5. Im interaktiven Modus an einem gültigen Block **Manuell** wählen: Tabellen-Zeichenwahl und Wahr/Falsch-Toggle prüfen sofort; Ganzzahlen, UTF-8-Codepoints und Farben über **Prüfen**.
6. Alternativ **Automatisch** wählen, um nur diesen Block zu lösen.
7. Nach dem Lösen optional zum nächsten offenen Block springen.

Der Dezimal/Hex-Schalter gilt für Rohwerte, Tabellenindizes, Ganzzahlergebnisse und numerische Antworten. Zusätzliche physikalische Farbhinweise bleiben ausdrücklich als Dezimalwerte mit Basis 10 gekennzeichnet. Aufgaben verraten weder das erwartete Ergebnis noch die korrekte Tabellenmarkierung; die Farb-Vorschau basiert allein auf den eigenen Sliderwerten.

### Dateiaufteilung

- [index.html](./index.html): Grundoberfläche und lokale Script-Einbindung.
- [styles.css](./styles.css): Layout, responsive Darstellung und visuelle Kennzeichnung.
- [decoder.js](./decoder.js): Validierung, Padding, Codierungsregister, BigInt, Zeichentabellen und Farbumrechnung.
- [learning.js](./learning.js): blockweise Entwürfe, Antwortprüfung, Fortschritt und einzelne Automatisierung.
- [app.js](./app.js): DOM-Darstellung, Einstellungen, Beispiele, Aufgaben-/Detaildialoge und Bedienereignisse.
- [calculator.js](./calculator.js), [calculator.css](./calculator.css): wiederverwendbarer Inline-Rechner mit exakter Rechenlogik und einstellbarer Ergebnisobergrenze.
- [decoder.test.js](./decoder.test.js): Tests der Decodierungslogik und Lernzustände ohne zusätzliche Abhängigkeiten.
- [calculator.test.js](./calculator.test.js): Rechenregeln, genaue Brüche, Basisumrechnung und Ressourcengrenzen.

Die Logikdateien sind sowohl als lokale Browser-Scripts als auch für Node-Tests nutzbar. Für neue Codierungen dient `BitDecoder.encodings` als Register; passende Oberflächen, Aufgaben und Erklärungen werden für den neuen Typ ergänzt.

### Veröffentlichung

- Öffentliches Repository: [nicolasruh/codierungen](https://github.com/nicolasruh/codierungen).
- Webseite: [nicolasruh.github.io/codierungen/](https://nicolasruh.github.io/codierungen/).
- GitHub Pages veröffentlicht den Projektstamm (`/`) des Branches `main`. Es ist kein eigener Build erforderlich; `.nojekyll` kennzeichnet die unveränderten statischen Dateien.
- Nach Änderungen die untenstehenden Tests ausführen, committen und nach `main` pushen. GitHub Pages übernimmt die Veröffentlichung; den Deployment-Status auf GitHub prüfen.
- Das direkte Öffnen der lokalen HTML-Datei bleibt unverändert möglich.

### Definition der Zeichentabellen

Die zweiten Hälften werden über die im Browser eingebaute `TextDecoder`-Implementierung für `windows-1252`, `windows-1250` und `windows-1251` gelesen. ASCII 0–127 bleibt in jeder Variante identisch. Zusätzlich werden die folgenden undefinierten Positionen ausdrücklich als unbelegt behandelt:

- Windows-1252: 129, 141, 143, 144, 157 (dezimal).
- Windows-1250: 129, 131, 136, 144, 152 (dezimal).
- Windows-1251: 152 (dezimal).

Beispiele in dezimaler Indexnotation: Deutsch Ä = 196, ß = 223; Polnisch Ą = 165; Kyrillisch А = 192. Derselbe Index 192 ergibt in den drei Erweiterungen À, Ŕ und А. Die Standardvariante belegt keine Position ab 128. Darstellung erfolgt immer in aufsteigender Reihenfolge, ASCII zuerst, Erweiterung darunter. In der Anwendung folgen diese Indizes dem Basisschalter.

### Validierung

Im Projektordner ausführen:

```sh
node --test decoder.test.js calculator.test.js
node --check app.js
node --check calculator.js
```

Node ist ausschließlich für Entwicklungstests erforderlich, nicht zum Benutzen der Anwendung.

Geprüfter Stand:

- 39 erfolgreiche Testgruppen, einschließlich sämtlicher Kombinationen aus Eingabelängen 0–64 und Blockgrößen 1–64.
- Browser: Einzelblöcke füllen die Informationsbreite ohne Fortschrittszähler; Mehrfachblöcke behalten Layout und Fortschritt. Roter offener Status ohne Rahmen, Hintergrund oder Padding, Wechsel über Daten/Blockgröße, UTF-8-Codepoints und Fehler sowie beide Modi bei 360 Pixeln geprüft.
- Vorzeichenbehaftete Ganzzahlen: Grenzwerte aller erlaubten Blockgrößen, sämtliche Bitmuster bis acht Bit, Null-Padding, negative Dez/Hex-Antworten und werttreue Entwürfe beim Basiswechsel.
- CMY: alle Dreikanal-Farbtiefen, Primär-/Mischfarben, Weiß/Schwarz, unveränderte Graustufen und manuelle Kanalprüfung.
- Browser: negative 64-Bit-Rechnerübernahme, gekoppelte Dez/Hex-Umrechnung, Aufgabenabschluss und automatische Ausgabe; CMY-Reglerfarben, Vorschau, Rechnergrenzen und Graustufen. Beide Erweiterungen auch bei 360 Pixeln ohne Seitenüberlauf geprüft.
- Rechner: Operatorrangfolge, Potenzen, Normalisierung, 64-Bit-Genauigkeit, exakte Brüche und 128 werttreue Dez/Hex-Rundläufe; klare Fehler für ungültige Ausdrücke und Ressourcengrenzen.
- Browser: Rechner für Ganzzahlen/UTF-8, tatsächliche Eingabefarben, Maus-/Tastatur-Operatoren mit Auswahlersetzung, gekoppelte Basis und explizite Umrechnungsfehler.
- Inline-Rechner: rohes Feld wird ersetzt und wiederhergestellt, Bits/Stellenwerte bleiben bei 360 Pixeln im sichtbaren Dialogbereich. Escape/Schließen erhält den Aufgabendialog und die bisherige Antwort; Übernehmen prüft nicht automatisch.
- Farben: pro Kanal rechts angeordnete Rechner, nur eine aktive Instanz, Wechsel ohne Übernahme, RGB/CMY/HSB/LAB-Vorschau, Graustufen und Bereichsgrenzen bis hinunter zu 1-Bit-Kanälen.
- Zeichen: berechnete Codes bleiben unbestätigt, erhalten Markierung und Klickhinweis; erst Anklicken prüft. Falsche Vorschläge, zweite Tabellenhälfte, Basiswechsel und blockweise Entwürfe sind geprüft.
- Exakte 64-Bit-Ergebnisübernahme und UTF-8-Codepoint-Aufgaben mit gekoppelter Basis; mobile Aufgabenansichten ohne horizontalen Überlauf.
- Kopf-Modusschalter, interaktiver Standard, Fortschritt mit „Blöcke“, gestrichelte/decodierte Karten und fehlendes Weiter an offenen/fehlerhaften Blöcken sind im Browser geprüft.
- Letzter Block: Abschluss-/Schließen-Control mit Fokus-Rückgabe; bei UTF-8-Fehlern keine falsche Erfolgsmeldung. Rücksetz-Hinweise verschwinden nach Klick oder Tastaturinteraktion.
- Kanal-Layout: Minimum/Maximum liegen am Regler, der größere Rohwert und das Symbol daneben; bei 360 Pixeln auch 23-Bit-Graustufen ohne horizontalen Überlauf. Dez/Hex, Rechnerübernahme und automatische Balkenansicht bleiben funktionsfähig.
- UTF-8: alle 65.792 Ein-/Zweibytefolgen gegen den strikten Browser-/Node-Decoder, skalare Grenzen, BOM, kombinierende Zeichen, gemischte 56-/64-Bit-Folgen, Byteerhalt und fehlerhafte Fortsetzungs-/Startbytes.
- UTF-8-Lernmodus: Dez/Hex-Entwürfe, richtige/falsche Codepoints und Ausschluss von Fehlerblöcken aus Fortschritt und Weiter-Funktion.
- Browser: UTF-8-Ergebnisse/Aufgaben, sichtbare Fehler, Unicode-Bereichsgrenzen, Surrogatraster, Seitenwechsel, Markierung und Erhalt von Öffnungs-/Scrollzustand bei sofortigem Basiswechsel.
- Modusschalter mit seitenweiten Blau-/Orange-Schemata; Einstellungstext mit Kontrast 5,10:1 bzw. 5,27:1. UTF-8 und Unicode-Raster in beiden Modi bei 360 Pixeln ohne Seiten-/Dialogüberlauf.
- Alle Ganzzahlgrößen, exakte 64-Bit-Werte, alle 24 Farbtiefen und RGB/HSB/LAB.
- Zeichentabellen, unbelegte Einträge, Boolean-Umkehrung und Basiswechsel.
- Unabhängige Blockaufgaben, falsche/richtige Antworten, getrennte Entwürfe und begrenzte Automatisierung.
- Sofortprüfung für Zeichen und Wahrheitswerte; nächster offener Block mit Überspringen gelöster Blöcke und zyklischer Suche.
- HSB-/LAB-Balkenfarben und schnelle Slider-Drags bis über beide Enden; retargetetes Loslassen, Pointer-Abbruch und bewusstes Backdrop-Schließen.
- Browserprüfung direkt über `file://`, einschließlich aller Aufgabenarten, Padding und unveränderter Originaldaten.
- Mobile Darstellung bei 360 Pixeln, intern scrollende Tabellen, Tastaturauswahl sowie Dialogschließen und Fokus-Rückgabe.
- Keine HTTP-/HTTPS-Anfragen während der geprüften Bedienabläufe.
