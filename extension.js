/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, GLib,Gio } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const ExtensionUtils = imports.misc.extensionUtils;


/* Import Clutter because is the library that allow you to layout UI elements */
const Clutter = imports.gi.Clutter;
var glib = imports.gi.GLib;


const Me = ExtensionUtils.getCurrentExtension();
const SCHEMA_NAME = 'org.gnome.shell.extensions.aed2inr-santhoshamilineni.gschema.xml';

// Retrieve GSettings
let Settings = ExtensionUtils.getSettings(SCHEMA_NAME);

let panelButton;
let Layout;

let oldRate=0;
let Rate = 0;
let CurrencyLabel;

//let TimeStamp = "Add Fixer API key https://fixer.io/"; //Initialize with some text for user to notify to add key
let TimeStamp;
let TimeStampLabel;

let AlertRate;
let AlertEntryBox;

//let APIKey = "650c2bb9e1dfcd6282964e08c5231113";
let APIKey;
let APIKeyEntryBox;

//Loop 
let loopTimeoutId = null;

const KeyFilePath = '.local/share/gnome-shell/extensions/aed2inr-santhoshamilineni.extension/key_file.txt';
const DataFilePath = '.local/share/gnome-shell/extensions/aed2inr-santhoshamilineni.extension/data_file.json';
const HistoryScriptPath= '.local/share/gnome-shell/extensions/aed2inr-santhoshamilineni.extension/history.py';

let DataJSONFile;
let JSONDataBase;

let loop_var = 0;
let AlertRateFlag = false;

let GREEN = 'color: #36C522;';
let RED = 'color: #c90000;';
let WHITE = 'color: #FFFFFF;';
let ORANGE = 'color: #FFA500;';



//the library to work with http request
let httpSession = new Soup.Session();

function getNewData() 
{
    if ( APIKey.length != 32) {
        return;
    }
    const baseUrl = `http://data.fixer.io/api/latest?access_key=${APIKey}`;
    
    //httpSession = new Soup.SessionSync()
    let message = Soup.Message.new('GET', baseUrl);
    // execute the request and define the callback
    httpSession.queue_message(message, Lang.bind(this,ResponceCB));
    print("Http Requested")
    return;
}

function ResponceCB(_httpSession, message) 
{
    let aedRate = 1;
    let inrRate = 1;
    print(`Responce CB ${message.status_code}`);
    /*
    if (message.status_code !== 201) {
        print("Invalid responce!!")
        print(message.response_body.data)
        return;
    };*/


    const data = JSON.parse(message['response-body'].data);
    
    if (data.success != true) {
        print("Invalid responce Status: !!",data.success)
        print(message.response_body.data)
        return;
    };

    // Extract AED rate, INR rate, and timestamp from the JSON data
    aedRate = data.rates.AED;
    inrRate = data.rates.INR;
    print(`AED rate: ${aedRate}`);
    print(`INR rate: ${inrRate}`);

    var unixTimestamp = data.timestamp;

    /* Create a new JavaScript Date object based on Unix timestamp.
    Multiplied it by 1000 to convert it into milliseconds */
    var date = new Date(unixTimestamp * 1000);

    // Generate date string
    print(date.toLocaleDateString("en-GB") + " " + date.toLocaleTimeString("default")); // Prints: 1:10:34 PM
    TimeStamp = date.toLocaleDateString("en-GB") + " " + date.toLocaleTimeString("default");

    print("Got Out from call:", aedRate, inrRate);


    //const gmtPlus5Time = convertToGMTPlus4(timestamp);
    //print(`Timestamp ${timestamp} in GMT+05:00 is: ${gmtPlus4Time}`);
    const oneAed = inrRate / aedRate - 0.16;
    print(`1 AED is equal to INR ${oneAed.toFixed(2)}`);
    Rate = oneAed;

    CurrencyLabel.set_text("INR ₹" + Rate.toFixed(3));
    TimeStampLabel.set_text("Last:" + TimeStamp);


    let newData = { "date":TimeStamp , "rate": Rate };
    JSONDataBase.push(newData);
    writeJSONFile(DataFilePath,JSONDataBase);

    CheckRateAlert();
    
    //httpSession.();

    return;
}

function loopCallback() {
    //CurrencyLabel.set_text("INR ₹" + loop_var);
    loop_var = loop_var + 1;
    //Rate = GetExchangeRate()
    if (loop_var > 60) {
        print("Getting New Data")
        getNewData();
        loop_var = 0;
        //Main.notify("Currency Updated");
    }

    print('Loop executed at: ' + new Date() + loop_var);

    // Return true to continue the loop or false to stop it
    return true;
}

function CheckRateAlert() {
    print("price old: "+ oldRate + " Current:"+ Rate);
    
    if (Rate == oldRate) { //If same white
        CurrencyLabel.style = WHITE; 
    } else if (Rate > oldRate) { //If currency rate is increasing set color orange
        CurrencyLabel.style = ORANGE;
    } else { //If currency decreasing
        CurrencyLabel.style = RED;
    }

    //Save Old rate
    oldRate = Rate;

    if (AlertRate > 1) {
        //Check price crossed alert rate set green
        if (Rate >= AlertRate) {
            if (AlertRateFlag == false) {
                //CurrencyLabel.style = GREEN;
                print("Alert Reached:", AlertRate);
                Main.notify("Alert Reached:", AlertRate);
                AlertRateFlag = true;
                CurrencyLabel.style = GREEN;
            } else {
                print("Already Notified!!")
            } 
        } 
        /*else if (Rate < AlertRate) {
                print("Alert not Reached", AlertRate);
                CurrencyLabel.style = RED;
                AlertRateFlag = false;
        }*/
    }
    else {
        print("Alert Rate not set:")
        //CurrencyLabel.style = WHITE;
        AlertRateFlag = false;
    }

}

function writeFile(filePath, data) {
    let file = Gio.file_new_for_path(filePath);
    var FileStream = file.replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);

    var DataStream = FileStream.write(data,null);
    print(DataStream)
    FileStream.close(null);
}

function writeJSONFile(filePath, data) {
    let file = Gio.file_new_for_path(filePath);
    var FileStream = file.replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);

    var DataStream = FileStream.write(JSON.stringify(data, null, 2),null);
    print(DataStream)
    FileStream.close(null);
}

function readFile(filePath) {
    var file = Gio.file_new_for_path(filePath);
    let size = file.query_info("standard::size",Gio.FileQueryInfoFlags.NONE,null).get_size();
    let stream = file.open_readwrite(null).get_input_stream();
    let data = stream.read_bytes(size, null).get_data();
    stream.close(null);
    //print(typeof data)
    //print(data)
    let byteArray = new Uint8Array(data);
    let textDecoder = new TextDecoder();
    let fileContent = textDecoder.decode(byteArray);
    return fileContent;
    //return data.toString(data);
}



// Global variable to store the process ID of the Python script
let pythonProcessId = null;

function runPythonScript() {
      // The command to run the Python script (adjust the path accordingly)
    let [success, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(
        null,
        ['python3', HistoryScriptPath, DataFilePath], // Replace with your script path and arguments
        null,
        GLib.SpawnFlags.SEARCH_PATH,
        null
    );
}

const _ = ExtensionUtils.gettext;
const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('My Shiny Indicator'));

            //let icon = new St.Icon({icon_name: 'face-smile-symbolic',style_class: 'system-status-icon',});
            CurrencyLabel = new St.Label({ text: "INR ₹ " + Rate.toFixed(3) ,y_expand: true, y_align: Clutter.ActorAlign.CENTER });
            TimeStampLabel = new St.Label({ text: "Last:" + TimeStamp });
            
            
            this.add_child(CurrencyLabel);
            //this.add_child(icon);
            //this.add_child(new St.Icon({icon_name: 'face-smile-symbolic',style_class: 'system-status-icon',}));

            // Create the entry item
            AlertEntryBox = new St.Entry({ hint_text: 'Set Alert Rate ex: 22.30' });
            AlertEntryBox.connect('key-press-event', this._onAlertEntryTextChanged);

            // Create the entry item
            APIKeyEntryBox = new St.Entry({ hint_text: "Fixer API key https://fixer.io/" });
            APIKeyEntryBox.connect('key-press-event', this._onAPIKeyEntryTextChanged);
            
            
            let ShowGraphMenuItem = new PopupMenu.PopupMenuItem(_('Show History'));
            ShowGraphMenuItem.connect('activate', () => { this._ShowGraph(ShowGraphMenuItem) });

            // Assemble all menu items     
            this.menu.box.add(TimeStampLabel);
            this.menu.box.add(APIKeyEntryBox);
            this.menu.box.add(AlertEntryBox);
            this.menu.addMenuItem(ShowGraphMenuItem);
            
        };

        _ShowGraph(item) {
            //Main.notify(_('History page In progress!!'));
            runPythonScript();
        };

        _onAlertEntryTextChanged() {
            // This callback will be executed when the entry text is changed
            let text = AlertEntryBox.get_text();
            print(`Entry text changed: ${text}`);
            AlertRate = Number(text);

            //Save Alert Rate setting
            Settings.set_double('alertrate', AlertRate);

            Main.notify("Alert Created at: " + AlertRate);
            CheckRateAlert();
        }

        _onAPIKeyEntryTextChanged() {
            // This callback will be executed when the entry text is changed
            const text = APIKeyEntryBox.get_text();
            print(`API Entry text changed: ${text}`);
            APIKey = text;
            if (APIKey.length == 32) {
                Main.notify("API Key Updated to " + APIKey);

                //Store Key file 
                //writeFile(KeyFilePath, APIKey);
                Settings.set_string('apikey', APIKey);
                
                getNewData();
            }
            else {
                //Main.notify("Wrong API Key Updated to " + APIKey);
            }
        }

    });


class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);   
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
        
        //Load Previous Data
        let content = readFile(DataFilePath);
        JSONDataBase =  JSON.parse(content.toString());
        
        //Read and set alert rate
        AlertRate = Settings.get_double('alertrate');
        if(AlertRate == 0){
            APIKeyEntryBox.set_text("Fixer API key https://fixer.io/" );
        } else {
            AlertEntryBox.set_text(AlertRate.toString());
        }
 
        
        // Read settings
        let data= Settings.get_string('apikey');
        if (data.length == 32) {
            APIKey = data;
            APIKeyEntryBox.set_text(data);
            getNewData();
        }
       loop_var = 0;
        if (loopTimeoutId == null) {
            // Start the loop with a 10-second interval
            loopTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, loopCallback);
        } else {
            print("Cannot start Loop already exist:"+loopTimeoutId)
        }

    }

    disable() {
         // Clear the timeout when disabling the extension to stop the loop
        if (loopTimeoutId != null) {
            print("Closing Loop")
            loop_var = 0;
            GLib.source_remove(loopTimeoutId);
            loopTimeoutId = null;
        }

        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
