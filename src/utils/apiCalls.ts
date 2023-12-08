export async function getNameInfo(address: string) {
    const response = await fetch('/names/address/' + address)
    const nameData = await response.json()

    if (nameData?.length > 0) {
        return nameData[0].name
    } else {
        return ''
    }
}