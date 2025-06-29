import { Feeds, getPosts } from "./feeds.js"

// Get CSRF token from cookie
function getCSRFTokenFromCookie() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export function createPost() {
    const fileInput = document.getElementById("file");
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const selectedCat = document.querySelectorAll('input[name="category"]:checked');

    // Validation: At least one field (title, content, or image) must be provided
    const hasTitle = title !== "";
    const hasContent = content !== "";
    const hasImage = fileInput && fileInput.files.length > 0;

    if (!hasTitle && !hasContent && !hasImage) {
        alert("Please provide at least one of the following: title, content, or image");
        return;
    }

    const categories = Array.from(selectedCat).map(cat => cat.value);

    const req = {
        title: title,
        content: content,
        categories: categories
    };

    if (hasImage) {
        REadFileContent(fileInput).then(({ file, fileContent }) => {
            req["filename"] = file;
            req["filecontent"] = fileContent;
            sendRequest(req);
        }).catch(err => {
            console.error("File reading error:", err);
            alert("Error reading file. Please try again.");
        });
    } else {
        sendRequest(req);
    }
}


function REadFileContent(input){
    return new Promise((resolve, reject)=>{
        const file = input.files[0]
        if (!file ){
            return resolve({file:null, fileContent:null})
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const filecontent = e.target.result
            resolve({file:file.name, fileContent: filecontent})
            
        }
        reader.onerror = function (e){
            reject(e)
        }
        reader.readAsDataURL(file)
    })

}


async function sendRequest(req) {
    try {
        const token = getCSRFTokenFromCookie();
        if (!token) {
            alert("Security token missing. Please refresh the page.");
            return;
        }

        const response = await fetch("/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": token
            },
            body: JSON.stringify(req),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok && data.type === "success") {
            getPosts("/feeds");
        } else {
            const errorMessage = data.message || data.type || "Failed to create post. Please try again.";
            alert(errorMessage);
        }
    } catch (err) {
        console.error("Post creation error:", err);
        alert("An error occurred. Please try again.");
    }
}

