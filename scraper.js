//Web scraper for Q2
const LOGIN_URL = "https://XXXXXXXXXX" //redacted login URL to not reveal company name
const USERNAME = "coop@XXXXXXXXXX" //redacted username to not reveal company name
const PASSWORD = "TheTest139"

const puppeteer = require('puppeteer');
const fs = require('fs'); //write the saved file to local Compiled_Reports folder
const path = require('path');

const downloadPath = path.join(__dirname, 'Compiled_Reports'); //change to whatever desired folder in local dir

if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
}

async function runWebScraper() {
    try {
        const browser = await puppeteer.launch({
            headless: false,  
            slowMo: 75,      
            defaultViewport: null 
        });
        const page = await browser.newPage();

        await page._client().send('Page.setDownloadBehavior', {
            //configure download permissions
            behavior: 'allow',
            downloadPath: downloadPath
        });
        console.log(`Files will be downloaded to: ${downloadPath}`); 

        console.log("Attempting to login into XXXXXX...");

        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
        await page.type('input[name="Email"]', USERNAME, { delay: 100 });
        await page.type('input[name="Password"]', PASSWORD, { delay: 100 });
        await page.click('input[value="Sign In"]');
        await page.waitForSelector('title',{timeout: 30000}); //wait for the "Welcome Co op" title to be visible
        
        console.log("Successful login to XXXX. Fetching PDF:");
        
        //PDF parsing code here...
        await page.waitForSelector('.nav-link.dropdown-toggle', { timeout: 10000 });
        await page.click('.nav-link.dropdown-toggle');

        await page.waitForSelector('a[href="/invoices/all"]') //navigate to Invoices -> All
        await page.click('a[href="/invoices/all"]');

        
        //Search #123 in the invoice number search bar
        await page.waitForSelector('th:nth-of-type(9) input', { timeout: 10000});
        await page.type('th:nth-of-type(9) input', '123', { delay: 150 });
        await page.keyboard.press('Enter');
        await page.waitForSelector('table#grid', { timeout: 10000 }); //wait for table to load using table's id grid
        
        await page.waitForFunction(() => {
            const rows = document.querySelectorAll('table#grid tbody tr');
            return Array.from(rows).some(row => row.innerText.includes("123444"));
        }, { timeout: 10000 });
        
        
        const invoiceRow = await page.waitForSelector('::-p-xpath(//tr[td[contains(text(), "123444")]])', { timeout: 10000 });
    
        const searchIcon = await invoiceRow.$('a[title="View/Edit"]'); //find magnifying glass icon to click on in the row
    
        if (searchIcon) {
            await page.evaluate(el => el.scrollIntoView(), searchIcon); 
            await searchIcon.click();
        } 

        //Download PDF and save to local directory (Compiled_Reports)
    
        await page.waitForSelector('.kv-file-download', { timeout: 5000 }); // Wait for the button to appear
        await page.click('.kv-file-download'); // Click the download button
        console.log("PDF download initiated...");
        
        const fileName = 'Invoice file.pdf'; //Check if download complete:
        const filePath = path.join(downloadPath, fileName);

        while (!fs.existsSync(filePath)) {
            //While the downloaded file is not complete, set timeout to 0.5 seconds
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`${fileName} successfully saved at ${filePath}`);
        await browser.close();
    }

    catch (error) {
        console.error("Error running web scraper: ", error);
    }
}

runWebScraper();




