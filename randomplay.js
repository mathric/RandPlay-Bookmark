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
let targetBookmark = null
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
    console.log("id " + String(newTabId))
    //need to triger video to play then go back to previous tab  
    window.setTimeout((() => {
      chrome.tabs.update(tabFlg ? curTabId : curTabId2, { active: true })
    }), waitTime);
  } 
}

function playMusic(bookmark) {

  //check if the tab already exist, if exist update else create new tab
  if (!newTabExistFlag) {
    console.log("tab created")
    //create new tab must at least switch one time to that tab
    let tempCreatURL = genRandBookmarkURL(targetBookmark) 
    ytContinuousFlg = false

    chrome.tabs.create({ url: tempCreatURL, active: false }, newTabCallback)
    newTabExistFlag = true
  }
  else {
    //detect if current on the music play tab => if yes change the flag
    if ((newTabId == curTabId2 && tabFlg) || (newTabId == curTabId && !tabFlg)) {
      tabFlg = !tabFlg
    }
    console.log("tab updated!" + String(newTabId))
    chrome.tabs.update(newTabId, { url: genRandBookmarkURL(targetBookmark) }, newTabCallback)
  }
}

function genRandBookmarkURL(bookmark) {
  let randIndex = Math.floor(Math.random() * (bookmark.length))
  //check if current url and prev are both yt video
  ytContinuousFlg = prevURL.includes("youtube.com") && bookmark[randIndex]['url'].includes("youtube.com")
  prevURL = bookmark[randIndex]['url']

  return bookmark[randIndex]['url']
}

function searchFolder(bookmarks, target) {
  for (let i = 0; i < bookmarks.length; i++) {
    let bookmark = bookmarks[i]
    if (bookmark.children) {
      if (bookmark.title == target) {
        targetBookmark = bookmark.children
      }
      else {
        searchFolder(bookmark.children, target)
      }
    }
  }
  return targetBookmark
}

//current only work for yt video
function updateUntilVideoAvail(tabId) {
  window.setTimeout( () => {
    chrome.tabs.executeScript(tabId, { code: `(${ytGetVideo})()` }, function (result) {
      if (!result[0]) {
        if(!clickFlg){
          chrome.tabs.update(tabId, { url: genRandBookmarkURL(targetBookmark) })
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
      playMusic(searchFolder(TreeNodes, DEFAULT_FOLDER))
    })
    initFlg = false
  }
  else {
    playMusic(targetBookmark)
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
      playMusic(targetBookmark)
    }
  }
})