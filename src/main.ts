import {dataJsonFormat, FormatList, FormattersList} from "./dataextract.ts";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const data = urlParams.get("q")

async function delay(duration: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

let redirect_to: string | null

function getData(data: string | null) {
    for (let i = 0; i < FormatList.length; i++) {
        let extractor = FormatList[i];
        try {
            let result = extractor(data);
            if (result) {
                return result
            }
        } catch (e) {

        }
    }
    return null
}

let challenge_id = document.getElementById("challenge_id");
let redirect = document.getElementById("redirect_to");
let timestamp = document.getElementById("timestamp");
let checkbox = document.getElementById("checkbox");
let title = document.getElementById("title");
let desc = document.getElementById("desc")
let spinner = document.getElementById("spinner");
let captcha = document.getElementById("captcha-btn");
let formatList = document.getElementById("create-format");
let createFormToggle = document.getElementById("create-form-toggle");
let createFormContainter = document.getElementById("create");
let createForm = document.getElementById("create-form");
let createFormat = <HTMLSelectElement>document.getElementById("create-format");
let createEaster = <HTMLInputElement>document.getElementById("create-easter");
let createLink = <HTMLInputElement>document.getElementById("create-input");
let createResult = <HTMLTextAreaElement>document.getElementById("create-results");
const withHttp = (url: string) => !/^https?:\/\//i.test(url) ? `http://${url}` : url;

async function normalRedirect(config: dataJsonFormat) {
    checkbox?.setAttribute("disabled", "true")
    if (!(config && challenge_id && redirect && timestamp && checkbox && title && desc && spinner && captcha)) {
        return
    }
    title.textContent = "Verifying..."

    await delay(500)
    await delay(getRandomInt(500, 2000))
    desc.innerHTML = `Redirecting to <a href="${config.to}">${config.to}<a/>`
    title.textContent = "Redirecting..."

    await delay(1000);

    window.location.assign(withHttp(config.to))
}

async function main() {
    const config = getData(data)
    redirect_to = config?.to ?? null

    if (!(challenge_id && redirect && timestamp && checkbox && title && desc && spinner && captcha)) {
        return
    }
    captcha.style.opacity = "0"
    captcha.style.pointerEvents = "none"

    if (config) {
        challenge_id.textContent = data;
        redirect.textContent = config.to;
        timestamp.textContent = Date.now().toString();
        if (config.easter) {
            // hehe
            captcha.innerHTML += `
            <iframe 
            title="Verify"
            id="easter-el"
            src="https://www.youtube.com/embed/xvFZjo5PgG0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            ></iframe>
            `
            window.addEventListener("blur", async (ev) => {
                await delay(1) // needed to fix firefox bug
                if (!(config && challenge_id && redirect && timestamp && checkbox && title && desc && spinner && captcha)) {
                    return
                }
                if (document.activeElement instanceof HTMLIFrameElement) {
                    await delay(100)
                    document.body.setAttribute("active", "")
                    title.textContent = "Got Em"
                    desc.textContent = "Will redirect you now lmao."
                    await normalRedirect(config)
                }
            });
        } else {
            checkbox.addEventListener("change", async (ev) => {
                if (!config.easter) {
                    await normalRedirect(config)
                }
            }, {
                once: true
            });
        }
    } else {
        title.textContent = "Invalid Redirect";
        desc.textContent = "This redirect is not valid!";
        spinner.style.display = "none";
        captcha.style.display = "none";


    }
    await delay(1000);

    captcha.style.opacity = ""
    captcha.style.pointerEvents = ""

}

async function editor() {
    if (!(formatList && createForm && createFormat && createEaster && createLink && createResult)) {
        return
    }
    for (let formattersListKey in FormattersList) {
        formatList.innerHTML += `<option value="${formattersListKey}">${formattersListKey}</option>`
    }
    createForm.addEventListener("submit", (e) => {
        if (!(formatList && createForm && createFormat && createEaster && createLink && createResult)) {
            return
        }
        e.preventDefault()
        createResult.value=FormattersList[createFormat.value](createLink.value,createEaster.checked)
    })
}

function toggleEditor() {
    if (!(createForm&&createFormToggle&&createFormContainter)) {
        return
    }
    createFormContainter.toggleAttribute("active")
    createFormToggle.textContent = createFormContainter.hasAttribute("active") ? "Close" : "Create"
}
createFormToggle?.addEventListener("click",()=>{
    toggleEditor()
})
editor()
main()
