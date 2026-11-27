// Signs in once, asking for the MFA code if needed, and saves the tokens that
// the live tests reuse.
const readline = require('readline');
const { signIn, TOKEN_DIR } = require('../helpers/live');

const mfaHandler = () =>
    new Promise((resolve) => {
        const input = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        input.question('MFA code: ', (code) => {
            input.close();
            resolve(code);
        });
    });

signIn({ mfaHandler })
    .then(() => console.log(`Tokens are in ${TOKEN_DIR}`))
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
