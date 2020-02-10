'use strict'; // necessary for es6 output in node

import {browser, element, by, ElementFinder, ElementArrayFinder} from 'protractor';
import {promise} from 'selenium-webdriver';
import {AppPage} from './app.po';

const expectedH1 = 'Tour of Heroes';
const expectedTitle = `${expectedH1}`;
const targetHero = {id: 15, name: 'Magneta'};
const targetHeroDashboardIndex = 3;
const nameSuffix = 'X';
const newHeroName = targetHero.name + nameSuffix;
const heroName = 'Narco';

class Hero {
  id: number;
  name: string;

  // Factory methods

  // Hero from string formatted as '<id> <name>'.
  static fromString(s: string): Hero {
    return {
      id: +s.substr(0, s.indexOf(' ')),
      name: s.substr(s.indexOf(' ') + 1),
    };
  }

  // Hero from hero list <li> element.
  static async fromLi(li: ElementFinder): Promise<Hero> {
    let stringsFromA = await li.all(by.css('a')).getText();
    let strings = stringsFromA[0].split(' ');
    return {id: +strings[0], name: strings[1]};
  }

  // Hero id and name from the given detail element.
  static async fromDetail(detail: ElementFinder): Promise<Hero> {
    // Get hero id from the first <div>
    let _id = await detail.all(by.css('div')).first().getText();
    // Get name from the h2
    let _name = await detail.element(by.css('h2')).getText();
    return {
      id: +_id.substr(_id.indexOf(' ') + 1),
      name: _name.substr(0, _name.lastIndexOf(' '))
    };
  }
}

describe('Taller 2 - E2E Testing', () => {

  beforeAll(() => browser.get(''));

  function getPageElts() {
    let navElts = element.all(by.css('app-root nav a'));

    return {
      navElts: navElts,

      appDashboardHref: navElts.get(0),
      appDashboard: element(by.css('app-root app-dashboard')),
      topHeroes: element.all(by.css('app-root app-dashboard > div h4')),

      appHeroesHref: navElts.get(1),
      appHeroes: element(by.css('app-root app-heroes')),
      allHeroes: element.all(by.css('app-root app-heroes li')),
      selectedHeroSubview: element(by.css('app-root app-heroes > div:last-child')),

      heroDetail: element(by.css('app-root app-hero-detail > div')),

      searchBox: element(by.css('#search-box')),
      searchResults: element.all(by.css('.search-result li'))
    };
  }


  describe('Heroes Dashboard ', () => {
    let page: AppPage;
    beforeEach(() => {
      page = new AppPage();
      page.navigateTo();
    });


    //Buscar héroes y Navegar a un héroe desde la búsqueda
    it(`Buscar Heroe: ${heroName}`, () => {
      getPageElts().searchBox.sendKeys(heroName);
      browser.sleep(1000);
      expect(element(by.css('.search-result')).getText()).toEqual(heroName);
    });


    //Eliminar un héroe - Narco
    it(`Eliminar Heroe: ${heroName}`, async () => {
      element(by.linkText('Heroes')).click();
      const heroesBefore = await toHeroArray(getPageElts().allHeroes);
      const li = getHeroLiEltById(12);
      li.element(by.buttonText('x')).click();
      const page = getPageElts();
      expect(page.appHeroes.isPresent()).toBeTruthy();
      expect(page.allHeroes.count()).toEqual(9, 'number of heroes');
      const heroesAfter = await toHeroArray(page.allHeroes);
      const expectedHeroes = heroesBefore.filter(h => h.name !== heroName);
      expect(heroesAfter).toEqual(expectedHeroes);
    });

    // -- Editar un héroe
    it(`Editar Heroe: ${heroName}`, () => {

      getPageElts().searchBox.sendKeys(heroName);
      browser.sleep(1000);
      let page = getPageElts();
      expect(page.searchResults.count()).toBe(1);
      let hero = page.searchResults.get(0);
      hero.click();
      updateHero(heroName);

    });

    //Navegar a un héroe desde el dashboard
    it(`Navegar a un heroe : ${targetHero.name} desde el dashboard`, dashboardSelectTargetHero);

    //-- Navegar a un héroe desde la lista de héroes
    it('Navegar a un heroe desde la lista de heroes', async () => {
      element(by.linkText('Heroes')).click();
      const li = getHeroLiEltById(12);
      li.click();
      let page = getPageElts();
      expect(page.heroDetail.isPresent()).toBeTruthy('shows hero detail');
    });


    // -- Navegar a un héroe desde la búsqueda
    it(`Navegar a un héroe: ${heroName} desde la búsqueda`, async () => {
      getPageElts().searchBox.sendKeys(heroName);
      browser.sleep(1000);
      let page = getPageElts();
      let hero = page.searchResults.get(0);
      hero.click();
      page = getPageElts();
      expect(page.heroDetail.isPresent()).toBeTruthy('shows hero detail');
    });

  });

  async function dashboardSelectTargetHero() {
    let targetHeroElt = getPageElts().topHeroes.get(targetHeroDashboardIndex);
    expect(targetHeroElt.getText()).toEqual(targetHero.name);
    targetHeroElt.click();
    browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6
    let page = getPageElts();
    expect(page.heroDetail.isPresent()).toBeTruthy('shows hero detail');
    let hero = await Hero.fromDetail(page.heroDetail);
    expect(hero.id).toEqual(targetHero.id);
    expect(hero.name).toEqual(targetHero.name.toUpperCase());
  }

  async function updateHeroNameInDetailView() {

    // Assumes that the current view is the hero details view.
    addToHeroName(nameSuffix);

    let page = getPageElts();
    let hero = await Hero.fromDetail(page.heroDetail);
    expect(hero.id).toEqual(targetHero.id);
    expect(hero.name).toEqual(newHeroName.toUpperCase());
  }


  async function updateHero(heroSel) {
    addToHeroName(heroSel + 'Test');
    let page = getPageElts();
    let hero = await Hero.fromDetail(page.heroDetail);
    expect(hero.name).toEqual((heroSel + 'TEST').toUpperCase());
  }

});


function addToHeroName(text: string): promise.Promise<void> {
  let input = element(by.css('input'));
  input.clear();
  return input.sendKeys(text);
}

function expectHeading(hLevel: number, expectedText: string): void {
  let hTag = `h${hLevel}`;
  let hText = element(by.css(hTag)).getText();
  expect(hText).toEqual(expectedText, hTag);
};

function getHeroAEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('..'));
}

function getHeroLiEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('../..'));
}

async function toHeroArray(allHeroes: ElementArrayFinder): Promise<Hero[]> {
  let promisedHeroes = await allHeroes.map(Hero.fromLi);
  // The cast is necessary to get around issuing with the signature of Promise.all()
  return <Promise<any>>Promise.all(promisedHeroes);
}
