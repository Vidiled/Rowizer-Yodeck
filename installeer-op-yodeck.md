# Rowizer-Yodeck installeren als Yodeck HTML App

Dit document beschrijft de minimale stappen om dit project te verpakken en te publiceren als een Yodeck HTML App en hoe je de app configureert in het Yodeck-portaal.

Vereisten
- Een Yodeck-account met rechten om Custom Apps toe te voegen
- Als je API-tokens gebruikt: behandel deze als geheimen (commit ze niet in versiebeheer)

Belangrijke bestanden
- `index.html` — het entrypoint van de app
- `js/` — applicatiecode (module-gebaseerd)
- `styles.css` — styling (inclusief de on-screen foutbanner)
- `schema.json` — UI-configuratieschema om in Yodeck te plakken

Korte stappen

1) ZIP het project

Vanaf de projectroot (de ZIP moet de bestanden in de root van het archief bevatten, dus niet in een extra map):

```bash
# Maak een zipbestand in de bovenliggende map
zip -r ../rowizer-yodeck.zip . -x '*.git*'
```

2) Maak de Custom App in Yodeck
- Ga naar Yodeck → Media & Apps → Custom Apps → Add New → HTML App
- Upload `rowizer-yodeck.zip`
- Geef de app een naam en eventueel een icoon

3) Voeg UI-configuratie toe
- In het formulier voor de Custom App vind je een tekstvak genaamd "UI Configuration". Plak daar de inhoud van `schema.json`. Hierdoor verschijnen de volgende velden voor beheerders wanneer ze een instantie van de app aanmaken:
  - `portal` (Text)
  - `token` (Password)
  - `branch` (Text)
  - `departmentsIgnore` (Text, komma-gescheiden)
  - `mergeAppointments` (Checkbox)
  - `external` (Text)
  - `date` (Date)


4) Opslaan en toewijzen
- Sla de Custom App op en voeg deze toe aan een Playlist of Schedule zoals gebruikelijk. Push de wijzigingen zodat Players de nieuwe app ophalen.


On-screen fouten
- De app toont een kleine, wegklikbare foutbanner bovenaan het scherm wanneer initialisatie faalt of wanneer `init_widget` een exception gooit. Dit helpt beheerders snel configuratieproblemen te zien.


Probleemoplossing
- Als de app na upload de foutbanner toont, controleer dan de browserconsole op de Player (of gebruik de web preview in Yodeck) voor details. Veelvoorkomende oorzaken:
  - Ontbrekend `token` of `portal`
  - Ongeldige `branch`-code
  - Netwerkproblemen richting Zermelo

