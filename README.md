# Chrome Serial Reader 
This is a chrome app to read Serial Data from devices like Arduino and send it to website of chrome extensions requesting it.

## Communicating with the app from web/extension from chrome browser
The app connects to any web application or chrome extension via chrome long messaging
1. From your web app or extension running at chrome invoke a connect with the extension 
id as parameter.

`let app = window['chrome']['runtime'].connect('INSTALLED_APP_ID');`

2. Send a post message with payload as below
`app.postMessage({sender: 'chrome-serial-reader'});`

3. If successfully installed the app will respond with and object
`{establishConnection: true}`

3. Now all listener to listen to serial reads

`app.onMessage.addListener((msg) => {
          console.log(msg);
 });`
 
 
## To quickly try out this app
1. Clone https://github.com/adnansabbir/CanSat-Web-Dashboard.git . This is an Angular project o track cansat
2. On src/app/pages/cansat-tracking/cansat-tracking-dashboard/cansat-tracking-dashboard.component.ts change the `browserAppId = 'OUR_APP_ID';`
3. To get app ID in chrome go to extension and at the bottom you will get Apps
