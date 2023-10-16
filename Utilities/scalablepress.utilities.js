const splitString = (inputString) => {
    if (inputString.length < 8) {
        return null; // Retorna null si la cadena es demasiado corta.
    }

    const front = inputString.slice(0, 7);
    const back = inputString.slice(-8);

    return { front, back };
}

module.exports = {
    splitString
}