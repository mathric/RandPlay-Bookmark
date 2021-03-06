const DEFAULT_FOLDER = "music"

//the wait time for video to start playing
const DEFAULT_YT_WAIT_TIME = 800
const DEFAULT_NICO_WAIT_TIME = 1000

//the wait time for script to check if video is playable
const VIDEO_AVAIL_WAIT_TIME = 1500

let targetBookmark = null
let curTabId = null
let curTabId2 = null
let newTabId = 0
let tabFlg = true
let waitTime = DEFAULT_YT_WAIT_TIME + VIDEO_AVAIL_WAIT_TIME
let newTabExistFlag = false
let clickFlg = false

import { ytGetVideo, ytInitVideoTime } from './youtube_controller.js'

function newTabCallback(newTab) {
  newTabId = newTab.id
  chrome.tabs.update(newTabId, { active: true })

  //need to triger video to play then go back to previous tab  
  window.setTimeout((() => {
    chrome.tabs.update(tabFlg ? curTabId : curTabId2, { active: true })
  }), waitTime);
}

function playMusic(bookmark) {

  //check if the tab already exist, if exist update else create new tab
  if (!newTabExistFlag) {
    chrome.tabs.create({ url: genRandBookmarkURL(targetBookmark), active: false }, newTabCallback)
    newTabExistFlag = true
  }
  else {
    //detect if current on the music play tab => if yes change the flag
    if ((newTabId == curTabId2 && tabFlg) || (newTabId == curTabId && !tabFlg)) {
      tabFlg = !tabFlg
    }
    chrome.tabs.update(newTabId, { url: genRandBookmarkURL(targetBookmark) }, newTabCallback)
  }
}

function genRandBookmarkURL(bookmark) {
  let randIndex = Math.floor(Math.random() * (bookmark.length))
  return bookmark[randIndex]['url']
}

function searchFolder(bookmarks, target) {
  for (let i = 0; i < bookmarks.length; i++) {
    let bookmark = bookmarks[i]
    if (bookmark.children) {
      if (bookmark.title == target) {
        targetBookmark = bookmark.children
        playMusic(bookmark.children)
      }
      else {
        searchFolder(bookmark.children, target)
      }
    }
  }
}

//current only work for yt video
function updateUntilVideoAvail(tabId) {
  window.setTimeout( () => {
    chrome.tabs.executeScript(tabId, { code: `(${ytGetVideo})()` }, function (result) {
      if (!result[0]) {
        if(!clickFlg){
          chrome.tabs.update(tabId, { url: genRandBookmarkURL(targetBookmark) })
        }
        else {

        }
      }
      else {
        //initialize the video time
        chrome.tabs.executeScript(tabId, { code: `(${ytInitVideoTime})()` }) 
      }
    })
  }, VIDEO_AVAIL_WAIT_TIME)
}

chrome.browserAction.onClicked.addListener(function (tab) {
  clickFlg = true
  chrome.bookmarks.getTree(function (TreeNodes) {
    searchFolder(TreeNodes, DEFAULT_FOLDER)
  })
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