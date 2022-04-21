import React from "react";
import { initializeBlock, Button } from "@airtable/blocks/ui";
import { phoneNumber } from "../config";
import BULK_SMS from "./sms";
const TaskComponent  = (props) => {
  switch (props.task) {
    case "sms":
      return <SMS onChange = {props.onChange}/>;
    case "bulk_sms":
        return <BULK_SMS onChange ={props.onChange} />
  }
};

const ButtonComponent = (props) => {
  function onButtonClick(value) {
    props.onChange(value);
  }
  return (
    <div style={{ padding: "4px" }}>
      <Button
        onClick={() => onButtonClick(props.value)}
        variant="primary"
        size="small"
        icon = {props.icon}
      >
        {props.buttonText}
      </Button>
    </div>
  );
};




class WelcomeBlock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      task: "",
      page: "",
      numberSms: 0,
      dateExpires: ''
    };
    this.onChange = this.onChange.bind(this);
  }
  onChange(value) {
    this.setState({ task: value });
  }

    updateState(sms,date){
        this.setState(
          {
            numberSms: `${sms}`,
            dateExpires: `${date}`
          });
       }

       getNumberSms = (token) => {
          var myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");
          myHeaders.append("Authorization", `Bearer ${token}`);


          var requestOptions = {
            method: 'GET',
            headers: myHeaders,
          };

          fetch("https://api.orange.com/sms/admin/v1/contracts", requestOptions)
            .then(response => response.json())
            .then(result => {
              let sms_number = result.partnerContracts.contracts[0].serviceContracts[0].availableUnits
              let sms_expire = result.partnerContracts.contracts[0].serviceContracts[0].expires

              this.updateState(sms_number,sms_expire)
              
            })
            .catch(error => console.log('error', error));
       }

      getToken = () =>{
        fetch("https://glacial-meadow-48415.herokuapp.com/function.php") 
          .then(res => res.json())
          .then(res => {
          if (res) {
                let authToken = res.access_token;
                //on recupere le token et on appele la fonction send()
                this.getNumberSms(authToken);
  
              }
              });
            };  

  componentDidMount() {
    this.getToken() 
   }

  render() {
    let task = this.state.task;
    if (
      phoneNumber != "" &&
      task == ""
    ) {
      return (
        <div style={{ textAlign: "center" }}>
          <h3>Bienvenue sur Send sms</h3>
          {/* <div>Veuillez choisir le mode d'envoie ?</div> */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              flexDirection: "column",
              marginTop: "10px",
            }}
           >
            <ButtonComponent
              buttonText={"Envoyer plusieurs SMS"}
              value={"bulk_sms"}
              onChange={this.onChange}
              icon = {"envelope"}
            />

          </div>
           <p style={{ textAlign: "center", color: "black", fontWeight: "bold" }}>
              Le nombre de sms restant: 
              <span style={{ color: "blue", fontWeight: "bold",   }}> {this.state.numberSms}</span> 
              <p style={{ color: "black", fontWeight: "bold",   }}>Et expire le {this.state.dateExpires}</p>
           </p>
        </div>
      );
    } else if (
      phoneNumber != "" &&
      task != ""
    ) {
      return <TaskComponent task={task} onChange={this.onChange} />;
    } else {
      return (
        <div style={{ textAlign: "center" }}>
          <h3>Bienvenue sur send sms 📱</h3>
          <div>
            🏃‍♀️ Pour commencer à utiliser l'envoi de sms, ajoutez vos informations d'identification orange api au
            fichier config.json.
          </div>
        </div>
      );
    }
  }
}

initializeBlock(() => <WelcomeBlock />);
