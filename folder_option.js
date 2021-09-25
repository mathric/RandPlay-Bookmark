let root_folder = document.getElementById("root_folder_list");
let save_button = document.getElementById("save_option_btn")
let directoryUnfoldState = new Map();
let checkBoxRecord = new Set(JSON.parse(localStorage.getItem("checkBoxRecord")))
let configSetting = {
    targetBookmark: new Set()
}

chrome.bookmarks.getTree(function (TreeNodes) {
    createDynamicList(TreeNodes[0], root_folder);
    console.log(TreeNodes[0])
});

//save the config
save_button.addEventListener("click", function(event) {
    //set can't properly save => need to convert to array
    localStorage.setItem("targetBookmark", JSON.stringify(Array.from(configSetting.targetBookmark)))
    localStorage.setItem("checkBoxRecord", JSON.stringify(Array.from(checkBoxRecord)))
})


function getIconSrc(url) {
    let tmp = document.createElement ('a')
    tmp.href = url
    console.log("tmp.hostname",tmp.hostname)
    return tmp.hostname
}


function createDynamicList(node, htmlParent) {
    //check if it is directory
    if (node.hasOwnProperty("children")) {
        for (let i = 0; i < node.children.length; i++) {
            let child = document.createElement("li");
            if (node.children[i].hasOwnProperty("children")) {
                //add folder class to set the icon
                child.classList.add('folder')
                //add input element to set the target directory
                let checkBtn = document.createElement('input');
                checkBtn.setAttribute('type', 'checkbox');
                let checkboxRecordKey = node.children[i].dateAdded.toString() + node.children[i].title
                if(checkBoxRecord.has(checkboxRecordKey)) {
                    checkBtn.setAttribute('checked', true)
                }

                child.appendChild(checkBtn)
                checkBtn.addEventListener("change", function (e) {
                    checkEventHandler(node.children[i], this.checked)              
                });

                let titleContent = document.createElement('span')
                titleContent.textContent = node.children[i].title
                child.appendChild(titleContent);

                //add button to expand the directory
                let unfoldBtn = document.createElement('button');
                unfoldBtn.classList.add('btn_folder')
                child.appendChild(unfoldBtn)

                let grandChild = document.createElement("ul");
                child.appendChild(grandChild)

                //register click listener to generate list in directory
                unfoldBtn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    foldClickHandler(node.children[i], grandChild)                 
                });
                //register the fold click listener to the text
                titleContent.addEventListener("click", function (e) {
                    e.stopPropagation();
                    foldClickHandler(node.children[i], grandChild)                 
                });
            }
            else {
                child.classList.add('bookmark_link')
                child.addEventListener("click", function (e) {
                    e.stopPropagation();             
                })
                //add icon
                let childIcon = document.createElement('img')
                //console.log(node.children[i].url)
                childIcon.src = "chrome://favicon/https://" + getIconSrc(node.children[i].url)
                //console.log(childIcon.src)
                child.appendChild(childIcon)

                let titleContent = document.createTextNode(node.children[i].title)
                child.appendChild(titleContent)
            }
            
            htmlParent.appendChild(child);  
        }
    }
}

function foldClickHandler(node, curElement) {
    let cur_unfold_state = directoryUnfoldState[node.id];

    //unfold it 
    if (cur_unfold_state === undefined || !cur_unfold_state) {
        createDynamicList(node, curElement);
        directoryUnfoldState[node.id] = true;
    }
    else{
        //fold it(remove all grandchild)
        while (curElement.firstChild) {
            curElement.removeChild(curElement.lastChild);
        }
        directoryUnfoldState[node.id] = false;
    }
}

//store the node in config and store checkboxstatus using hash key dateAdded + title
function checkEventHandler(node, check=true) {
    if(check) {
        configSetting.targetBookmark.add(node)
        console.log(node)
        checkBoxRecord.add(node['dateAdded'].toString() + node['title'])
    }
    else {
        configSetting.targetBookmark.delete(node)
        checkBoxRecord.delete(node['dateAdded'].toString() + node['title'])
    }
    console.log(configSetting.targetBookmark)
}