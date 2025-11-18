# Rowizer — class schedule changes viewer (fork)

> Fork of the original Rowizer by Xinne van der Oord (Vlietland College). This fork adds Yodeck HTML App support and a small set of deployment helpers. See [deploy-to-yodeck](deploy-to-yodeck.md) [installeer-op-yodeck.md](deploy-to-yodeck.md) for instructions.

## What's new in this fork

This fork adds several Yodeck-specific integrations and helpers while preserving the app's original behavior for local testing.

- Yodeck init: provides `window.init_widget(config)` so Yodeck can pass configuration to the app instance.
- `schema.json`: a UI form definition you can paste into Yodeck's "UI Configuration" to expose admin fields.
- `deploy-to-yodeck.md`: step-by-step packaging and upload instructions for Yodeck.
- On-screen dismissible error banner to surface misconfiguration directly on displays.

### How this is implemented

This fork implements Yodeck compatibility while keeping the original URL-parameter behavior for local testing. Key points:

- Initialization: the app exposes a global function `window.init_widget(config)`. Yodeck calls this after loading the app and passes a JS object that contains the fields configured in the Yodeck UI.
- Fallback to URL parameters: for local/dev testing the app still reads configuration from the URL query string (for example `?portal=...&token=...&branch=...`).
- Precedence: values provided in `init_widget(config)` take precedence over URL query parameters.
- Mapping to existing parameters: the following `config` fields map directly to the old URL parameters (and to `schema.json`):
	- `portal` -> portal (string)
	- `token` -> token (string, treat as secret)
	- `branch` -> branch (string)
	- `departmentsIgnore` -> departmentsIgnore (comma-separated string or array)
	- `mergeAppointments` -> mergeAppointments (boolean or string; the code treats the string 'false' as false)
	- `external` -> external (string)
	- `date` -> date (string, accepted as-is for previewing)

- Departments ignore: when `departmentsIgnore` is supplied as a comma-separated string the app splits it into an array before passing to the connector. If the schema editor produces an array, that is accepted as well.
- Error visibility: initialization errors are surfaced via a dismissible banner at the top of the screen. There is also a simple API for showing errors manually from the console: `window.showError('message', {timeout: 5000})`.


## Rowizer: 
- Determines the actual impact the changes have on the schedule: only relevant information[^1] is shown - no endless lists of changes. 
- Highlights new changes (made after 8AM)
- Always shows activities in green 
- Automatically fetches new changes from Zermelo
- Shows absent teachers 
- Scroll if there are too many changes

[^1]:  Cluster changes are currently always shown, in the future only relevant changes will appear. Eg: If entl4 with students X and Y is cancelled but biol1 (taken by student X) and ges2 (student Y) are moved to that period, the entl4 cancellation will not be shown - all students know where they have to go.

![Screenshot of a live Rowizer-Yodeck example](/assets/img/example.png)


### Get an API-token
[Zermelo has written a nice how-to](https://support.zermelo.nl/guides/applicatiebeheerder/koppelingen/overige-koppelingen-2/koppeling-met-overige-externe-partijen#stap_1_gebruiker_toevoegen)! 
> [!TIP]
> If you don't want to show the absent teachers don't add the "Afwezigen" authorization. Rowizer detects this automatically

## Testing

1) Host web app using a simple Python web server (from the project root):

```bash
python3 -m http.server 8000
```

2) URL-based local testing (replace values with your own):

```
http://localhost:8000/index.html?portal=j9qeq&token=ec2h7u9cd612a1gr11q5k1a4ou&branch=a&date=22-03-2024
```

3) Force an on-screen error to verify the banner (open DevTools console):

```js
window.showError('Test error: configuration missing', {timeout: 8000});
```


> [!WARNING]
> Rowizer is designed for (big) TV screens. The best result is achieved when using a 50 inch or larger 4K screen.


## URL Parameters
|Parameter| Example value              | required           | Description                                                                                                                                                                                                                                                                                                                                                                                |
|------|----------------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|portal| j9qeq                      | x                  | The zportal ID (so the part before .zportal.nl)                                                                                                                                                                                                                                                                                                                                             |
|token| ec2h7u9cd612a1gr11q5k1a4ou | x                  | The API-token [generated](https://support.zermelo.nl/guides/applicatiebeheerder/koppelingen/overige-koppelingen-2/koppeling-met-overige-externe-partijen) in your Zermelo portal                                                                                                                                                                                                           |
|branch| a                          | if multiple branches | The branch code (vestigingscode) found in Portal inrichting -> Vestigingen                                                                                                                                                                                                                                                                                                                 |
|date| 22-03-2024                 | | To test Rowizer you can use a different date                                                                                                                                                                                                                                                                                                                                               |
|external| extern                     | | If you the location with this name to an appointment, Rowizer will show the attending teachers just below the absent ones. This way, students will quickly see that a certain teacher is not available at school.                                                                                                                                                                          |
|departmentsIgnore| kopkl,vavo                 || Some departments should not be taken into consideration while determining if a whole education or yearOfEducation is present in an appointment.                                                                                                                                                                                                                                            |
|mergeAppointments| false                      | | Before Zermelo 24.07 apoointments that span multiple periods were published as seperate appointments. (See [the release docs](https://support.zermelo.nl/news/posts/release-2407#wat_is_een_publicatieblokn)). If this parameter is omitted or set to anything but 'false', Rowizer automatically merges these appointments based on successive periods and identical teachers and groups. 