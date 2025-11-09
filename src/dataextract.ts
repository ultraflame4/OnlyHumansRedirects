
export interface dataJsonFormat {
    to: string,
    easter?: boolean
}

async function CalculateChecksum(subject: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("ISO-8859-1"); // use latin1 encoding or elase atob btoa will not work
    const data = encoder.encode(subject);
    const hash = await crypto.subtle.digest("SHA-256", data)
    console.log(decoder.decode(hash)[0])
    return decoder.decode(hash)[0]
}


async function ChecksumTest(check: string, subject: string) {
    let hashed = await CalculateChecksum(subject)
    if (hashed != check) {
        console.warn(`Checksum failed! Data hash [${check}] does not match generated hash [${hashed}] !\nData might be corrupted!`)
        return false
    }
    return true
}

/**
 * Special calculation of checksum for format B.
 * 
 * Returns the checksum for subject. Always 1 byte. Least sig. bit is always 0
 * @param subject 
 * @returns 
 */
async function CalculateChecksum_formatB(subject: string): Promise<number> {
    let checksum_char = await CalculateChecksum(subject)
    let encoder = new TextEncoder()
    let startbyte = encoder.encode(checksum_char)[0];
    startbyte &= 0b11111110 // Clear least sig byte
    return startbyte
}

async function ChecksumTest_formatB(startbyte: number, subject: string) {
    let checkbytes_a = startbyte & 0b11111110 // Clear least sig byte for checking
    let checkbytes_b = await CalculateChecksum_formatB(subject)
    if (checkbytes_a != checkbytes_b) {
        console.warn(`Checksum failed! Data hash [${checkbytes_a}] does not match generated hash [${checkbytes_b}] !\nData might be corrupted!`)
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
    console.log("%c========[ Trying format Json ]========",'color: lightgreen')
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
    console.log("%c========[ Trying format A ]========",'color: lightgreen')
    if (!data) {
        return null
    }
    try {
        const decoded = atob(data);
        const easter: boolean = decoded[0] == '1';
        const to = decoded.slice(1, decoded.length - 1);
        const check = decoded[decoded.length - 1]
        let subject = decoded.slice(0, decoded.length - 1)
        if (!await ChecksumTest(check, subject)) {

            return null
        }

        return { easter, to };
    } catch (e) {
        console.error(e)
        return null
    }
}


/**
 * Data is stored like this
 * 1. First byte stores the easter boolean & checksum. 
 *    - 1 bit is easter flag
 *    - Other bits are checksum
 * 2. Rest of string other than last character is url
 * 3. Last character checksum -> md5 hash of the string (excluding the last char which is the check) and get first character
 */
async function getData_FormatB(data: string | null): Promise<null | dataJsonFormat> {
    console.log("%c========[ Trying format B ]========",'color: lightgreen')
    if (!data) {
        return null
    }
    try {
        const decoded = atob(data);

        const startbyte = decoded.charCodeAt(0)
        console.log("Format B startbyte:", startbyte)

        const easter: boolean = (startbyte & 1) !== 0; // check LSB;
        console.log("Format B easter:", easter)

        const url = decoded.slice(1);
        if (!await ChecksumTest_formatB(startbyte, `${easter ? 1 : 0}${url}`)) {

            return null
        }
        return { easter, to: url };
    } catch (e) {
        console.error(e)
        return null
    }
}

export const FormatList: Array<(data: string | null) => Promise<dataJsonFormat | null>> = [
    getData_Json,
    getData_FormatA, // new format after json
    getData_FormatB
]


export const FormattersList: { [name: string]: (url: string, easter: boolean) => Promise<string> } = {
    async formatB(url, easter) {
        // Checksum temp includes the easter flag
        let startbyte = await CalculateChecksum_formatB(`${easter ? 1 : 0}${url}`);
        startbyte |= easter ? 0b00000001 : 0b00000000 // Set least sig byte depending on easter
        console.log("FormatB startbyte:", startbyte)
        return btoa(String.fromCharCode(startbyte) + url)
    },
    async formatA(url, easter) {
        let subject = `${easter ? 1 : 0}${url}`
        return btoa(subject + await CalculateChecksum(subject))
    },
    async formatJson(url, easter) {
        return btoa(JSON.stringify({ to: url, easter }))
    },

}
