import React, { useState } from "react";
import {
  useRecords,
  Input,
  Button,
  Link,
  TablePicker,
  ViewPicker,
  useBase,
  FieldPicker,
} from "@airtable/blocks/ui";
import { phoneNumber } from "../config";

let authToken;

const ButtonComponent = (props) => {
  const base = useBase();
  const table = base.getTableByName(props.values.table);
  const view = table.getViewByName(props.values.view);
  const queryResult = view.selectRecords();
  const records = useRecords(queryResult);
  const [sendingProgress, setSendingProgress] = useState(null);


  
 

  function sms() {
    let message;
    let required_fields = [];
    if (props.values.message) {
      message = props.values.message;
      let positions = [];
      for (let i in message) {
        if (message[i] == "{" || message[i] == "}") {
          positions.push(parseInt(i, 10));
        }
      }
      for (let j = 0; j < positions.length; j++) {
        required_fields.push(message.slice(positions[j] + 1, positions[j + 1]));
        j++;
      }
    }
    if (message) {
      var messageObj = {
        phone: [],
        sms_text: [],
      }; 

           getToken();            

    }

     function getToken(){
      fetch("https://glacial-meadow-48415.herokuapp.com/function.php") 
        .then(res => res.json())
        .then(res => {
        if (res) {
              authToken = res.access_token;
              //on recupere le token et on appele la fonction send()
              sendSms(authToken);

            }
            });
          };   

    async function sendSms(authTokenPhp) {
      records.map((record) => {
        if (required_fields) {
          required_fields.forEach((element) => {
            if (table.getFieldByNameIfExists(element)) {
              if (messageObj[element]) {
                messageObj[element].push(record.getCellValue(element));
              } else {
                messageObj[element] = [record.getCellValue(element)];
              }
            }
          });
        }
        messageObj.phone.push(record.getCellValue(props.values.field));
        messageObj.sms_text.push(props.values.message);
      });
      for (var key in messageObj) {
        if (key != "phone" || key != "sms_text") {
          console.log(key);
          for (var k = 0; k <= messageObj[key].length; k++) {
            if (messageObj[key][k]) {
              messageObj.sms_text[k] = messageObj.sms_text[k].replace(
                "{" + key + "}",
                messageObj[key][k]
              );
            }
          }
        }
      }
      
      let progress = 0;
      for (let j = 0; j <= messageObj.phone.length; j++) {
        if (messageObj.phone[j]) {

          var myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");
          myHeaders.append("Authorization", `Bearer ${authTokenPhp}`);

          var raw = JSON.stringify({
            "outboundSMSMessageRequest": {
              "address": `tel:+223${messageObj.phone[j]}`,
              "senderAddress": "tel:+2230000",
              "senderName": "Kabakoo",
              "outboundSMSTextMessage": {
                "message": messageObj.sms_text[j]
              }
            }
          });


          var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
          };

          await fetch("https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B2230000/requests",
           requestOptions).then((res) => {
            progress++;
            setSendingProgress(progress / messageObj.phone.length);
          });
        }
      }
      setSendingProgress(null);
    }
  }

  return (
    <Button
      onClick={() => sms()}
      style={{ background: '#18BFFF'}}
    >
      {sendingProgress
        ? `Sending SMS ... (${Math.round(sendingProgress * 100)}%)`
        : "SEND "}
    </Button>
  );
};

const GetCountComponent = (props) => {
  const base = useBase();
  let records;
  base.tables.map((record) => {
    if (record.name == props.table) {
      record.views.map((views) => {
        if (views.name == props.view) {
          records = views;
        }
      });
    }
  });
  if (records) {
    return (
      <>
        <div>Le message doit contenir au maximium 150 caratères</div>
        <div>Vous allez envoyer {useRecords(records).length} messages 👾.</div>
      </>
    );
  } else {
    return <div>Vous allez envoyer 0 messages 👾.</div>;
  }
};

const FieldPickerComponent = (props) => {
  const [field, setField] = useState(null);
  const base = useBase();
  const table = base.getTableByNameIfExists(props.table);
  return (
    <FieldPicker
      field={field}
      table={table}
      onChange={(newField) => {
        props.onChange("field", newField.name);
        setField(newField);
      }}
      width="320px"
    />
  );
};

const ViewPickerComponent = (props) => {
  const [view, setView] = useState(null);
  const base = useBase();
  const table = base.getTableByNameIfExists(props.table);
  return (
    <ViewPicker
      table={table}
      view={view}
      onChange={(newView) => {
        props.onChange("view", newView.name);
        props.onChange("viewId", newView.id);
        setView(newView);
      }}
      width="320px"
    />
  );
};

const TablePickerComponent = (props) => {
  const [table, setTable] = useState(null);
  return (
    <TablePicker
      table={table}
      onChange={(newTable) => {
        setTable(newTable);
        props.onChange("table", newTable.name);
        props.onChange("view", "");
        props.onChange("field", "");
        props.onChange("records", []);
      }}
      width="320px"
    />
  );
};

class BULK_SMS extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: "",
      table: "",
      view: "",
      field: "",
      viewObj: "",
      length: "",
      records: [],
      message: "",
      button_color: "#18BFFF",
      button_text: "SEND",
    };
    this.onViewChange = this.onViewChange.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  onViewChange() {
    this.props.onChange("");
  }
  onChange(key, value) {
    console.log(key + " " + value);
    this.setState({ [key]: value });
    console.log(this.state);
  }

  render() {
    let messageCount;
    let fieldPicker;
    if (this.state.view && this.state.table) {
      fieldPicker = (
        <div style={{ padding: "4px", paddingBottom: "0px" }}>
          <p>Sélectionnez le champ qui contient les numéros de téléphone</p>
          <FieldPickerComponent
            table={this.state.table}
            onChange={this.onChange}
          />
        </div>
      );
    }
    if (this.state.field && this.state.table && this.state.view) {
      messageCount = (
        <div>
          <GetCountComponent
            table={this.state.table}
            view={this.state.view}
            onChange={this.onChange}
          />
          <textarea
            style={{ width: "320px", marginTop: "4px" }}
            rows="5"
            type="text"
            value={this.state.message}
            onChange={(e) => this.onChange("message", e.target.value)}
            name="message"
            placeholder="Entrez un message ici, vous pouvez inclure des champs en utilisant {field-name}."
          />
        </div>
      );
    }
    let buttonComponent;
    if (this.state.field && this.state.table && this.state.view) {
      buttonComponent = (
        <ButtonComponent values={this.state} onChange={this.onChange} />
      );
    }

    return (
      <div style={{ padding: "10px" }}>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            this.onViewChange();
          }}
          target="_blank"
        >
          Back
        </Link>
        <div style={{ textAlign: "center" }}>
          <h4>Envoyer plusieurs SMS</h4>
          <TablePickerComponent onChange={this.onChange} />
          <div style={{ padding: "4px", paddingBottom: "0px" }}>
            <ViewPickerComponent
              table={this.state.table}
              onChange={this.onChange}
            />
          </div>
          {fieldPicker}
          <div style={{ padding: "8px", paddingBottom: "0px" }}>
            {messageCount}
          </div>
          <div style={{ padding: "8px", paddingBottom: "0px" }}>
            {buttonComponent}
          </div>
        </div>
      </div>
    );
  }
}
export default BULK_SMS;
