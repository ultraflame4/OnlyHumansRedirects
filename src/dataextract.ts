
export interface dataJsonFormat {
    to: string,
    easter?: boolean
}

async function CalculateChecksum(subject: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("ISO-8859-1"); // use latin1 encoding or elase atob btoa will not work
    const data = encoder.encode(subject);
    const hash = await crypto.subtle.digest("SHA-256",data)
    console.log(decoder.decode(hash)[0])
    return  decoder.decode(hash)[0]
}
async function ChecksumTest(check:string, subject:string) {
    let hashed = await CalculateChecksum(subject)
    if (hashed != check) {
        console.warn(`Checksum failed! Data hash [${check}] does not match generated hash [${hashed}] !\nData might be corrupted!`)
        return false
    }
    return true
}

/**
 * Setups stuff for redirect
 * Returns false on failure or bad data
 * Format for this data is exactly the same as datajsonFormat
 * @param data
 */
async function getData_Json(data: string | null): Promise<dataJsonFormat | null> {
    if (!data) {
        return null
    }
    const decoded = atob(data)

    let setupData: dataJsonFormat;
    try {
        setupData = JSON.parse(decoded)
    } catch (e) {
        return null
    }
    if (!setupData.to) {
        return null
    }

    const redirect_to = setupData?.to;
    const easter: boolean = setupData?.easter ?? false

    return {
        easter: easter, to: redirect_to
    };
}

/**
 * Data is stored like this
 * 1. First char stores the easter boolean. 1->true others -> false
 * 2. Rest of string other than last character is url
 * 3. Last character checksum -> md5 hash of the string (excluding the last char which is the check) and get first character
 */
async function getData_FormatA(data: string | null): Promise<null | dataJsonFormat> {
    if (!data) {
        return null
    }
    try {
        const decoded = atob(data);
        const easter: boolean = decoded[0] == '1';
        const to = decoded.slice(1, decoded.length - 1);
        const check = decoded[decoded.length - 1]
        let subject = decoded.slice(0, decoded.length - 1)
        if (!await ChecksumTest(check,subject)) {

            return null
        }

        return {easter, to};
    } catch (e) {
        console.error(e)
        return null
    }
}

export const FormatList: Array<(data: string | null) => Promise<dataJsonFormat | null>> = [
    getData_Json,
    getData_FormatA // new format after json
]


export const FormattersList: { [name: string]: (url: string, easter: boolean) => Promise<string>} = {
    async formatJson(url,easter) {
        return btoa(JSON.stringify({to:url,easter}))
    },
    async formatA(url,easter) {
        let subject = `${easter?1:0}${url}`
        return btoa(subject+await CalculateChecksum(subject))
    },
}
