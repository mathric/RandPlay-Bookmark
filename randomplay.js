const DEFAULT_FOLDER = "music"

//the wait time for video to start playing
const DEFAULT_YT_WAIT_TIME = 1000
const DEFAULT_NICO_WAIT_TIME = 1000

//the wait time for script to check if video is playable
const VIDEO_AVAIL_WAIT_TIME = 2000

//threshold time to determined if need to start video from beginning
const INIT_PLAY_TIME_THRESHOLD = 5

//if all videos are yt video can use this mode and will keep auto playing next video
const YT_CONTINUOUS_MODE = true

let initFlg = false
let defaultTargetBookmark = null
let curTabId = null
let curTabId2 = null
let newTabId = 0
let tabFlg = true
let waitTime = DEFAULT_YT_WAIT_TIME + VIDEO_AVAIL_WAIT_TIME
let newTabExistFlag = false
let clickFlg = false
let ytContinuousFlg = false
let prevURL = ""

import { ytGetVideo, ytInitVideoTime } from './youtube_controller.js'

function newTabCallback(newTab) {
  newTabId = newTab.id

  //if not having continuous yt video then need to triger video play on different site by going to the tab
  //the flg is true only when prev and current video are yt video 
  if(!ytContinuousFlg) {
    chrome.tabs.update(newTabId, { active: true })
    //console.log("id " + String(newTabId))
    //need to triger video to play then go back to previous tab  
    window.setTimeout((() => {
      chrome.tabs.update(tabFlg ? curTabId : curTabId2, { active: true })
    }), waitTime);
  } 
}

function playMusic() {

  //check if the tab already exist, if exist update else create new tab
  if (!newTabExistFlag) {
    //console.log("tab created")
    //create new tab must at least switch one time to that tab
    let tempCreatURL = genRandBookmarkURL() 
    ytContinuousFlg = false

    chrome.tabs.create({ url: tempCreatURL, active: false }, newTabCallback)
    newTabExistFlag = true
  }
  else {
    //detect if current on the music play tab => if yes change the flag
    if ((newTabId == curTabId2 && tabFlg) || (newTabId == curTabId && !tabFlg)) {
      tabFlg = !tabFlg
    }
    //console.log("tab updated!" + String(newTabId))
    chrome.tabs.update(newTabId, { url: genRandBookmarkURL() }, newTabCallback)
  }
}

const readLocalStorage = async(key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function(result) {
      if (result[key] === undefined) {
        reject([]);
      } else {
        resolve(result[key]);
      }
    })
  })
}

function genRandBookmarkURL(/*bookmark*/) {
  let targetBookmark = []
  //index for directory treenode
  let randDirIndex = null
  //random dir node
  let randNode = null
  //random child index in random directory node
  let randIndex = null

  targetBookmark = JSON.parse(localStorage.getItem("targetBookmark"))
  // chrome.storage.local.get('targetBookmark', function(data){
  //   if(data) {
  //     targetBookmark = [...data.targetBookmark]
  //     console.log("data")
  //     console.log(targetBookmark)
  //   }
  //   console.log(data)
  // })
  console.log(targetBookmark)
  if(targetBookmark == null || targetBookmark.length == 0) {
    randNode = defaultTargetBookmark
    //console.log("randNode", randNode)
  }
  else {
    randDirIndex = Math.floor(Math.random() * (targetBookmark.length))
    console.log(targetBookmark[randDirIndex])
    randNode = targetBookmark[randDirIndex]
    console.log("randNode", randNode)
  }
  randIndex = Math.floor(Math.random() * (randNode['children'].length))
  let maxSearch = 20
  while(!randNode['children'][randIndex].hasOwnProperty('url') && maxSearch > 0) {
    randIndex = Math.floor(Math.random() * (randNode.length))
    maxSearch -= 1
  }
  
  ytContinuousFlg = prevURL.includes("youtube.com") && randNode['children'][randIndex]['url'].includes("youtube.com")
  prevURL = randNode['children'][randIndex]['url']

  return randNode['children'][randIndex]['url']
  // let randIndex = Math.floor(Math.random() * (bookmark.length))
  // //check if current url and prev are both yt video
  // ytContinuousFlg = prevURL.includes("youtube.com") && bookmark[randIndex]['url'].includes("youtube.com")
  // prevURL = bookmark[randIndex]['url']

  // return bookmark[randIndex]['url']
}

//return tree node of the target
function searchFolder(bookmarks, target) {
  for (let i = 0; i < bookmarks.length; i++) {
    let bookmark = bookmarks[i]
    if (bookmark.children) {
      if (bookmark.title == target) {
        //console.log("found search target")
        let searchTargetBookmark = bookmark.children
        return searchTargetBookmark
      }
      else {
        let result = searchFolder(bookmark.children, target)
        if(result) {
          //console.log("result", result)
          return result
        }
      }
    }
  }
  return null
}

//current only work for yt video
function updateUntilVideoAvail(tabId) {
  window.setTimeout( () => {
    chrome.tabs.executeScript(tabId, { code: `(${ytGetVideo})()` }, function (result) {
      if (!result[0]) {
        if(!clickFlg){
          chrome.tabs.update(tabId, { url: genRandBookmarkURL() })
        }
      }
      else {
        //initialize the video time
        chrome.tabs.executeScript(tabId, { code: `(${ytInitVideoTime})(${INIT_PLAY_TIME_THRESHOLD})` }) 
      }
    })
  }, VIDEO_AVAIL_WAIT_TIME)
}

chrome.browserAction.onClicked.addListener(function (tab) {
  clickFlg = true
  if(!initFlg) {
    chrome.bookmarks.getTree(function (TreeNodes) {
      defaultTargetBookmark = searchFolder(TreeNodes, DEFAULT_FOLDER)
      //console.log("defaultTargetBookmark",defaultTargetBookmark)
      playMusic()
    })
    initFlg = false
  }
  else {
    playMusic()
  } 
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    if (tabFlg) {
      curTabId = tab.id
      tabFlg = false
    }
    else {
      curTabId2 = tab.id
      tabFlg = true
    }
  });
});
//prevent prerendering to cause tabID changing
chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
  if (removedTabId == newTabId) {
    newTabId = addedTabId
  }
})

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  if (tabId == newTabId) {
    newTabExistFlag = false
  }
})

//onupdate listener might fired multiple times due to iframe => use oncompleted listener
chrome.webNavigation.onCompleted.addListener(function(details) {
  if(details.tabId == newTabId && details.frameId == 0) {
    clickFlg = false
    if(details.url.includes("youtube.com")) {
      updateUntilVideoAvail(newTabId)
      waitTime = DEFAULT_YT_WAIT_TIME + VIDEO_AVAIL_WAIT_TIME
    }
    //scroll down a little bit if it's nico site to triger video play
    else if (details.url.includes("https://www.nicovideo")) {
      chrome.tabs.executeScript(newTabId, { code: "window.scrollTo(0,500)" })
      waitTime = DEFAULT_NICO_WAIT_TIME + VIDEO_AVAIL_WAIT_TIME
    }
  }
})

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  if(message.from == "youtube_controller") {
    if(message.message == "yt_video_end" && YT_CONTINUOUS_MODE) {
      clickFlg = true
      playMusic()
    }
  }
})