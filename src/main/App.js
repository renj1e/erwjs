import '../assets/css/App.css'
import React, { Component } from 'react'
import socketIOClient from 'socket.io-client'
import os from 'os'

const ENDPOINT = 'http://127.0.0.1:4001';
const image_src = require('../assets/img/bg/'+(Math.floor(Math.random() * 20) + 1)+'.jpg').default;

const audio_done_src = require('../assets/sounds/pomo-done.mp3').default
const audio_start_src = require('../assets/sounds/pomo-start.mp3').default
const audio_stop_src = require('../assets/sounds/pomo-stop.mp3').default
var socket = socketIOClient(ENDPOINT);

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      result: {},
      data: '',
      response: '',
      screens: [],
    };
    this.videoTag = React.createRef()
  }

async getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });
}

  async componentDidMount(){
    socket.on("FromAPI", async (data) => {      
      await this.setState({
        response: data
      });
    });

    // Send
    socket.emit('new_conn', {user : os.userInfo().username})
    // socket.on('notif_new_conn', async (data) => {      
    //   console.log('notif_new_conn', data)
    // });
    // // Receive
    // socket.on('notif_off_conn', async (data) => {      
    //   console.log('notif_off_conn', data)
    // });

    window.ipcRenderer.on('ping', async (event, message) => { 
        console.log(message) 
        await this.setState({
          data: message
        });
    });    

    // Receive
      var windowIpcRenderer = window.ipcRenderer
    socket.on('broadcast_screen_share', async (data) => { 
        console.log('broadcast_screen_share', windowIpcRenderer)
        windowIpcRenderer.on('allow-remote', async (event, message) => { 
            console.log(message) 

            const inputSources = await window.desktopCapturer.getSources({
              types: ['window', 'screen']
            });

            if(data.target !== 'admin'){
              await this.setState({
                screens: inputSources
              });
            } 

            // const videoOptionsMenu = window.remote.buildFromTemplate(
            //   inputSources.map(source => {
            //     return {
            //       label: source.name,
            //       click: () => this.selectSource(source)
            //     };
            //   })
            // );
            // console.log(inputSources)
            // await videoOptionsMenu.popup();  
        });
    });

    await fetch('https://api.quotable.io/random') //http://quotes.rest/qod.json
      .then(res => res.json())
      .then(
        async (result) => {
          await setTimeout(async () => {
            await this.setState({
              isLoaded: true,
              result: result
            });
          }, 1000)

        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  async selectTarget(target) {    
    await socket.emit('screen_share', {
      target: target
    })
    await this._openShare(target)
  }
  // Change the videoSource window to record
  async selectSource(source) {    
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
              minWidth: 1280,
              maxWidth: 1280,
              minHeight: 720,
              maxHeight: 720
        }
      }
    };

    // Create a Stream
    const stream = await navigator.mediaDevices
      .getUserMedia(constraints);

    // Preview the source in a video element
    this.videoTag.current.srcObject = stream;
    this.videoTag.current.play();
  }

  async componentWillUnmount(){
    await socket.emit('off_conn', {user : os.userInfo().username})
  }

  async _openExcel(){
    await window.ipcRenderer.send('request','open-excel');
  }

  async _openShare(target){
    await window.ipcRenderer.send('screen-share', {
      request: 'all-screen',
      target: target
    });
  }

  async _showNotif(m){    
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
    } else {
      console.log("Notifications are supported");
      var options = {
        body: "This is the body of the Notification",        
        icon: "https://cdn.pixabay.com/photo/2018/01/21/01/46/architecture-3095716_960_720.jpg",
        image: 'https://cdn.pixabay.com/photo/2018/01/21/01/46/architecture-3095716_960_720.jpg',
        dir: "auto"
      };
    new Notification('Hey! This is a notif.', options)
    }
  }

  render() {
    const { result, data, response, screens } = this.state
    if(result.content){
      return (
        <div style={{textAlign: 'center'}}>
          <audio src={audio_done_src} autoPlay/>
          <audio src={audio_start_src} autoPlay/>
          <audio src={audio_stop_src} autoPlay/>
          <h1>Hello, Electron! {data} <time dateTime={response}>{response}</time></h1>
          <img src={image_src} alt="Logo" style={{width: '100%'}} />
          <p>"{ result.content }"</p>
          <p>by { result.author }</p>
          <button className='btn btn-info'
            onClick={() => this._showNotif('info')}>Info
          </button>
          <button className='btn btn-info'
            onClick={() => this._openExcel()}>Open Excel
          </button>

          <video autoPlay 
        ref={this.videoTag} src="#" controls></video>

          <hr/>
          {
            screens.map((i, k) => {
              return <button key={k} className="button is-primary" onClick={() => this.selectSource(i)}>{i.name}</button>
            })
          }
          <button className="button is-primary" onClick={() => this.selectTarget('Web Stack Studio')}>Target: Web Stack Studio</button>

           <button id="videoSelectBtn" onClick={this.getVideoSources} className="button is-text">
      Choose a Video Source
    </button>
        </div>
      )
    }
      return <p>Loading........</p>
  }
}

export default App
