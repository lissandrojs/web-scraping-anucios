import  { URL_SITE, SEARCH_BY_TERM,CLASS_NAME_INPUT,CLASS_NAME_BUTTON } from './constants/index.js';
import puppeteer from 'puppeteer';

const inicialPuppeteer = async () => { 
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto(URL_SITE, { waitUntil: 'networkidle2'});
    } catch (error) {
        console.error('Erro ao carregar a página:', error.message);
    }
    
    const searchInput = await page.$(CLASS_NAME_INPUT);
    if (searchInput) {
        await searchInput.type(SEARCH_BY_TERM);
    } else {
        console.log('Campo de busca não encontrado');
    }
 
    const searchButton = await page.$(CLASS_NAME_BUTTON);
    if (searchButton) {
        await searchButton.click();
    } else {
        console.log('Botão de busca não encontrado');
    }
    
    try{
        await filterContentAnnouncement(page)
    }catch(error){
        console.error('Error ao buscar conteudo de anuncios',error)
    }

    await browser.close();
};

const filterContentAnnouncement = async (page) =>{
    let advertisements = []; 
    let currentPage = 1

    while (true) {
        try {
            await page.waitForSelector('.olx-ad-card');
    
            const adsFromPage = await page.evaluate((currentPage) => {
                const adsElements = Array.from(document.querySelectorAll('.olx-ad-card'));
                return adsElements.map(anuncio => ({
                    titulo: anuncio.querySelector('h2.olx-text--title-small')?.textContent.trim(),
                    preco: anuncio.querySelector('h3.olx-text--semibold')?.textContent.trim(),
                    link: anuncio.querySelector('a.olx-ad-card__link-wrapper')?.href,
                    localizacao: anuncio.querySelector('.olx-ad-card__location p')?.textContent.trim(),
                    data: anuncio.querySelector('.olx-ad-card__date--horizontal')?.textContent.trim(),
                    page: currentPage
                }));
            }, currentPage);
    
            advertisements = advertisements.concat(adsFromPage);
    
            const nextPage = await page.$('a[data-ds-component="DS-Button"].olx-button--link-button');
    
            if (nextPage) {
                const linkTexto = await page.evaluate(link => {
                    const span = link.querySelector('span.olx-button__content-wrapper');
                    return span ? span.textContent.trim() : '';
                }, nextPage);
    
                if (linkTexto === 'Próxima página') {
                    await nextPage.click();
                     currentPage++
                    await page.waitForNavigation({ waitUntil: 'networkidle2' }); 
                } else {
                    break;
                }
            } else {
                break; 
            }
        } catch (err) {
            console.error('Erro ao buscar os anúncios ou navegar:', err.message);
            break; 
        }
    }
    console.log(advertisements)
}


inicialPuppeteer()