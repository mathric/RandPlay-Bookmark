let root_folder = document.getElementById("root_folder_list");
let directoryUnfoldState = new Map();

chrome.bookmarks.getTree(function (TreeNodes) {
    createDynamicList(TreeNodes[0], root_folder);
});

function createDynamicList(node, htmlParent) {
    //check if it is directory
    if (node.hasOwnProperty("children")) {
        for (let i = 0; i < node.children.length; i++) {
            let child = document.createElement("li");

            if (node.children[i].hasOwnProperty("children")) {
                //add input element to set the target directory
                let checkBtn = document.createElement('input');
                checkBtn.setAttribute('type', 'checkbox');
                child.appendChild(checkBtn)
                child.innerHTML += node.children[i].title;

                //add button to expand the directory
                let unfoldBtn = document.createElement('input');
                unfoldBtn.setAttribute('type', 'button');
                child.appendChild(unfoldBtn)

                let grandChild = document.createElement("ul");
                child.appendChild(grandChild)

                //register click listener to generate list in directory
                drop.addEventListener("click", function (e) {
                    e.stopPropagation();
                    foldClickHandler(node.children[i], grandChild)                 
                });
            }
            else {
                child.addEventListener("click", function (e) {
                    e.stopPropagation();             
                });
                child.innerHTML += node.children[i].title;
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
        console.log(curElement)
        while (curElement.firstChild) {
            curElement.removeChild(curElement.lastChild);
        }
        directoryUnfoldState[node.id] = false;
    }
}
