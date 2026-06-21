# InkScan

This application is designed to capture the ink batch codes use for each print job. The table can be saved as a CSV file to the device. 

# Using the app
* Turn on the Bluetooth Scanner. It should already be paired and will automatically connect to the tablet. if nto see instructions below to set it up.
* Open the **Ink Scan** app from the icon on the device
the date field will contain todays date. You can change this if you want to use a different date but be consistent with the date format i.e. dd/mm/yyyy
* Enter the Job number in the 'Job Number' field below
* Enter the wieght in the 'Weight' field below
* Tap on the Barcode field to select it (it will have a blue border to show it is selected)
* Scan the barcode of the ink batch codes. this will create a new line in the table
* The Weight and Barcode fields willl Clear and the Weight field will be selected again. you will need to add a new weight before you can scan another barcode.

## Save table as CSV
The save as CSV button will Save the current table as a CSV file. Depending on the browser settings this should save to the **'Downloads'** folder

## Clear Table
This button will clear the table without saving any data

## Load Previously saved CSV into table
Below the Table is a button labeled "choose files" this will allow you to open a previously saved CSV file fo ink batch codes. 
* Click the "Load CSV file" button
* Click "OK" to continue or "Cancel" if you want to save the data already in the table
* From the options popup at the bottom of the devices select "Documents"
* Search for the previously saved file and select it
* Once this file has loaded you can continue to add rows to the top of the table
* Remember to save the updated file once you have added new info to the table

# Transfering the data

## Via Cable
To copy the CSV files to a computer:
* connect the device to computer with a Micro USB cable
* In Windows Explorer you should see the Tablet as another drive on the PC
* Open the Tablet folder and navigate to the **"Downloads"** folder 
  (unless you have set the device to save web downloads ot a different folder)
* Copy or move the files to a folder on the PC
* Delete any files you no longer want on the device
* Unplug the device

# reload the app

## remove the old app
* Press and hold the app icon untill icons appear at the top of the page to move or delete.
* Drag the app icon onto the delete icon and it will dissapear.
* Go to https://mbshaw.github.io/inkscan/ in a browser on the device.
* Clear the Cache by:
  * Tapping the 3 dots at the top right of the Chrome browser
  * Settings → Site settings → tap 'All sites' → choose 'your site' → clear and reset


# Install the App for offline use
* Go to https://mbshaw.github.io/inkscan/ in a browser on the device.
* Once loaded tap the menu button at the top left of the browser window (Three vertical dots)
* Select 'Add to Home Screen'
* A popup will appear where you can edit the App name, Click 'OK'
* Return to home screen and swipe the pages until you find the app.
* Tap on Icon to launch App

# Setup scanner and soft keyboard

## Connecting a bluetooth barcode reader

* turn on the Bluetooth Scanner
* Enable Bluetooth on your device
  * Go to Settings --> connections --> Bluetooth 
  * tap 'Pair device' and select wireless scanner

https://www.waspbarcode.com/barcode-scanners/wws100i-pocket-barcode-scanner



## Enabling the on screen keybaord with a bluetooth barcode reader

Attaching a Bluetooth barcode reader in HID mode (Acts as a keybaord not a serial input) make the device think there is already a keyboard attached so will not display the screen keyboard when text entry is required. You will need to change settings in the tablet to solve this.
To enable both a BT barcode scanner and the screen keyboard:
* Settings --> General Management
* Tap Language & Input
* Tap Physical Keyboard 
* Select 'Show on-screen keyboard'

# ToDo
- [x] Ensure app works fully offline
- [x] Import saved csv files to app table
- [x] Add loaded Job number to form
- [x] Clear table data when loading saved file
- [x] Added Weight to table
- [ ] Allow editing of table cells in app
