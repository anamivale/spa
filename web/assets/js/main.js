import { Signup } from "./auth.js"
import { authTemplate, createPost, feeds } from "./templates.js"

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
        document.getElementById("app").innerHTML = authTemplate()
        document.getElementById("signup").addEventListener("click", ()=>{
            console.log("clicked");
            Signup()

        })

    }

})

function IsCookiesPresent() {
    
    if (document.cookie){
        console.log(document.cookie);

        return true
    }
    return false
}

