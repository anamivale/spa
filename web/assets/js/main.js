import { createPost, feeds, loginTemp } from "./templates.js"

function Feeds() {
let body = document.getElementById("app")
body.innerHTML = feeds()


let Createpost = document.getElementById("createpost")

Createpost.addEventListener("click", ()=>{
    body.innerHTML = createPost()
    
})    
}
document.addEventListener('DOMContentLoaded', ()=>{
    if (IsCookiesPresent()){
        Feeds()

    }else{
        document.getElementById("app").innerHTML = loginTemp()

    }

})

function IsCookiesPresent() {
    
    if (document.cookie){
        console.log(document.cookie);

        return true
    }
    return false
}

