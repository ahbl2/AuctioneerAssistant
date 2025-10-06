import { type AuctionItem, type InsertAuctionItem, type Location, type InsertLocation } from "@shared/schema";
import { randomUUID } from "crypto";
import { scraper } from "./scraper";

export interface IStorage {
  // Auction Items
  getAuctionItems(): Promise<AuctionItem[]>;
  getAuctionItem(id: string): Promise<AuctionItem | undefined>;
  createAuctionItem(item: InsertAuctionItem): Promise<AuctionItem>;
  searchAuctionItems(query: string): Promise<AuctionItem[]>;
  filterAuctionItems(filters: {
    conditions?: string[];
    states?: string[];
    facilities?: string[];
    minPrice?: number;
    maxPrice?: number;
  }): Promise<AuctionItem[]>;
  refreshAuctionData(): Promise<void>;
  
  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
}

export class MemStorage implements IStorage {
  private auctionItems: Map<string, AuctionItem>;
  private locations: Map<string, Location>;
  private isScrapingComplete = false;

  constructor() {
    this.auctionItems = new Map();
    this.locations = new Map();
    this.seedLocations();
    this.seedFallbackData();
    this.initializeWithScrapedData();
  }

  private async initializeWithScrapedData(): Promise<void> {
    try {
      console.log('Fetching live auction data from bidft.auction...');
      const scrapedData = await scraper.getAuctionData();
      
      if (scrapedData.items.length > 0) {
        console.log(`Successfully loaded ${scrapedData.items.length} items from bidft.auction`);
        this.auctionItems.clear();
        scrapedData.items.forEach(item => {
          const id = randomUUID();
          this.auctionItems.set(id, { ...item, id });
        });
        this.isScrapingComplete = true;
      } else {
        console.log('No items scraped, keeping fallback seed data');
      }
    } catch (error) {
      console.error('Error loading scraped data, keeping fallback:', error);
    }
  }

  async refreshAuctionData(): Promise<void> {
    try {
      console.log('Refreshing auction data from bidft.auction...');
      const scrapedData = await scraper.getAuctionData(true);
      
      if (scrapedData.items.length > 0) {
        this.auctionItems.clear();
        scrapedData.items.forEach(item => {
          const id = randomUUID();
          this.auctionItems.set(id, { ...item, id });
        });
        console.log(`Refreshed ${scrapedData.items.length} auction items`);
      }
    } catch (error) {
      console.error('Error refreshing auction data:', error);
    }
  }

  private seedLocations() {
    const locationData = [
      {
        id: randomUUID(),
        state: "Kentucky",
        facilities: [
          "Louisville - Intermodal Dr. - Louisville, KY",
          "Georgetown - Triport Road - Georgetown, KY", 
          "Florence - Industrial Road - Florence, KY",
          "Elizabethtown - Peterson Drive - Elizabethtown, KY",
          "Franklin - Washington Way - Franklin, KY",
          "Erlanger - Kenton Lands Rd - 100 - Erlanger, KY",
          "Sparta - Johnson Rd - Sparta, KY"
        ]
      },
      {
        id: randomUUID(),
        state: "Ohio",
        facilities: [
          "Dayton - Webster Street - Dayton, OH",
          "Cincinnati - School Road - Cincinnati, OH",
          "Dayton - Edwin C. Moses Blvd. - Dayton, OH",
          "Amelia - Ohio Pike - Amelia, OH",
          "Strongsville - Drake Rd - Strongsville, OH",
          "Cincinnati - Broadwell Rd - Cincinnati, OH",
          "Cincinnati - West Seymour Ave. - Cincinnati, OH",
          "Columbus - Chantry Drive - Columbus, OH",
          "Vandalia - Industrial Park Drive - Vandalia, OH",
          "Columbus - Phillipi Rd - Columbus, OH",
          "Mansfield - Lexington Ave - Mansfield, OH",
          "Cincinnati - Colerain Ave. - Cincinnati, OH"
        ]
      },
      {
        id: randomUUID(),
        state: "Arkansas", 
        facilities: [
          "Rogers - N Dixieland Rd. - Rogers, AR",
          "Siloam Springs - Propak UAC - Siloam Springs - Siloam Springs, AR",
          "Harrison - 701 US-65 - Harrison, AR",
          "Propak UAC - Siloam Springs - Siloam Springs, AR"
        ]
      },
      {
        id: randomUUID(),
        state: "Tennessee",
        facilities: [
          "LaVergne - Industrial Blvd Ste D - LaVergne, TN",
          "Kingsport - Hwy 75 - Kingsport, TN"
        ]
      },
      {
        id: randomUUID(),
        state: "Texas",
        facilities: [
          "Midlothian - Propak UAC - Dallas Autobahn - Midlothian, TX"
        ]
      }
    ];

    locationData.forEach(loc => this.locations.set(loc.id, loc));
  }

  private seedFallbackData() {
    const auctionItemsData = [
      {
        id: randomUUID(),
        title: "Portable carpet cleaner machine with steam and heating technology",
        description: "15kpa powerful suction with versatile tools for pets, couch, car, self-cleaning, compact spot cleaner for stairs/furniture/rug 3\" hand tool, 5\" hand tool gray",
        imageUrl: "https://fta-image-proxy.herokuapp.com/3ILv3V2BE-SLHYSHVHe7pSLwZ5yqsE8z6djxbDovpPI/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNjFNMHgxdld4RkwuX0FDX1NMMTUwMF8uanBn",
        condition: "Good Condition",
        location: "Florence - Industrial Road",
        state: "Kentucky",
        facility: "Florence - Industrial Road - Florence, KY",
        endDate: new Date("2025-10-06"),
        currentPrice: "42.50",
        msrp: "160.00",
        amazonSearchUrl: "https://www.amazon.com/s?k=Portable%20carpet%20cleaner%20machine%20with%20steam%20and%20heating%20techology%2C15kpa%20powerful%20suction%20with%20versatile%20tools%20for%20pets%2C%20couch%2C%20car%2Cself-cleaning%2C%20compact%20spot%20cleaner%20for%20stairs%2Ffurniture%2Frug%203%22%20hand%20tool%2C5%22hand%20tool%20gray&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539560&idItems=46129324"
      },
      {
        id: randomUUID(),
        title: "Comhoma convertible sofa bed, 71\" fabric couch with adjustable backrest",
        description: "Loveseat recliner sleeper living room furniture futon set (black)",
        imageUrl: "https://fta-image-proxy.herokuapp.com/YrJCtJwlENiDFuFa1owPhwr5QQ2w1E6MGczc-RAanRY/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNzFWd043ODNjY0wuX0FDX1NMMTUwMF8uanBn",
        condition: "As Is",
        location: "Florence - Industrial Road", 
        state: "Kentucky",
        facility: "Florence - Industrial Road - Florence, KY",
        endDate: new Date("2025-10-06"),
        currentPrice: "20.00",
        msrp: "170.00",
        amazonSearchUrl: "https://www.amazon.com/s?k=Comhoma%20convertible%20sofa%20bed%2C71%3Ffabric%20couch%20with%20adjustable%20backrest%2Cloveseat%20recliner%20sleeper%20living%20room%20furniture%20futon%20set%20(black)&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539560&idItems=46129332"
      },
      {
        id: randomUUID(),
        title: "Vesgantti 108\" modular sectional sofa, comfy cloud couch",
        description: "Movable ottoman deep seat chenille l shaped modular sofa, sectional couches for living room, bedroom and apartment, beige (incomplete box 1)",
        imageUrl: "https://fta-image-proxy.herokuapp.com/z6oTIGifF55IR8eP9B5v3tEXG6YpUBiWM1wddNnpFKs/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvODFmekpUaEY2Y0wuanBn",
        condition: "As Is",
        location: "Cincinnati - West Seymour Ave.",
        state: "Ohio", 
        facility: "Cincinnati - West Seymour Ave. - Cincinnati, OH",
        endDate: new Date("2025-10-06"),
        currentPrice: "101.00",
        msrp: "659.99",
        amazonSearchUrl: "https://www.amazon.com/s?k=Vesgantti%20108%5C%22%20modular%20sectional%20sofa%2C%20comfy%20cloud%20couch%20with%20movable%20ottoman%20deep%20seat%20chenille%20l%20shaped%20modular%20sofa%2C%20sectional%20couches%20for%20living%20room%2C%20bedroom%20and%20apartment%2C%20beige(incomplete%20box%201)&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539040&idItems=46063001"
      },
      {
        id: randomUUID(),
        title: "Miulee decorative linen euro sham pillow covers 24x24 natural beige",
        description: "Boho farmhouse neutral couch throw pillows for bed pack of 2 accent modern pillowcase sofa livingroom home decor 24\" x 24\" (pack of 2) natural beige 2",
        imageUrl: "https://fta-image-proxy.herokuapp.com/yBvev74Z5JonshHcF5JvRC5zQchmkcJXTNZ25IwTMog/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNzFGUzdQNCtLT0wuX0FDX1NMMTUwMF8uanBn",
        condition: "New/Like New",
        location: "Amelia - Ohio Pike",
        state: "Ohio",
        facility: "Amelia - Ohio Pike - Amelia, OH", 
        endDate: new Date("2025-10-06"),
        currentPrice: "10.50",
        msrp: "18.69",
        amazonSearchUrl: "https://www.amazon.com/s?k=Miulee%20decorative%20linen%20euro%20sham%20pillow%20covers%2024x24%20natural%20beige%20%3Fboho%20farmhouse%3F%20%3Fneutral%20couch%20throw%20pillows%20for%20bed%20pack%20of%202%20accent%20modern%20pillowcase%20sofa%20livingroom%20home%20decor%2024%22%20x%2024%22%20(pack%20of%202)%20natural%20beige%202&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539184&idItems=46084270"
      },
      {
        id: randomUUID(),
        title: "Buyify folding lap desk, 23 inch portable wood white laptop bed desk",
        description: "Lap desk with cup holder, for working reading writing, eating, watching movies for bed sofa couch floor",
        imageUrl: "https://fta-image-proxy.herokuapp.com/sgMC_fEC0o4pVHM03F73aO2JcnGldSPzsI8gM9u6Sns/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNjFYNmh3LUlsWkwuX0FDX1NMMTUwMF8uanBn",
        condition: "Good Condition",
        location: "Dayton - Edwin C. Moses Blvd.",
        state: "Ohio",
        facility: "Dayton - Edwin C. Moses Blvd. - Dayton, OH",
        endDate: new Date("2025-10-06"),
        currentPrice: "13.50",
        msrp: "33.00",
        amazonSearchUrl: "https://www.amazon.com/s?k=Buyify%20folding%20lap%20desk%2C%2023%20inch%20portable%20wood%20white%20laptop%20bed%20desk%20lap%20desk%20with%20cup%20holder%2C%20for%20working%20reading%20writing%2C%20eating%2C%20watching%20movies%20for%20bed%20sofa%20couch%20floor&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539074&idItems=46067334"
      },
      {
        id: randomUUID(),
        title: "iRobot Roomba robot vacuum and mop combo (Y0140)",
        description: "Vacuums and mops, easy to use, power-lifting suction, multi-surface cleaning, smart navigation cleans in neat rows, self-charging, works with alexa",
        imageUrl: "https://fta-image-proxy.herokuapp.com/LXRx5nBXOwo9u54lVP1xDh2VdHSGy_0vNCFuvS3URrM/el:f/g:no/h:600/rt:fill/w:600/aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNzFTNDlTUHFEK0wuanBn",
        condition: "As Is",
        location: "Vandalia - Industrial Park Drive",
        state: "Ohio",
        facility: "Vandalia - Industrial Park Drive - Vandalia, OH",
        endDate: new Date("2025-10-06"),
        currentPrice: "10.50",
        msrp: "149.00",
        amazonSearchUrl: "https://www.amazon.com/s?k=Irobot%20roomba%20robot%20vacuum%20and%20mop%20combo%20(y0140)%20-%20vacuums%20and%20mops%2C%20easy%20to%20use%2C%20power-lifting%20suction%2C%20multi-surface%20cleaning%2C%20smart%20navigation%20cleans%20in%20neat%20rows%2C%20self-charging%2C%20works%20with%20alexa&tag=ftasearch-20",
        auctionUrl: "https://www.bidfta.com/itemDetails?idauctions=539263&idItems=46087435"
      }
    ];

    auctionItemsData.forEach(item => this.auctionItems.set(item.id, item));
  }

  async getAuctionItems(): Promise<AuctionItem[]> {
    return Array.from(this.auctionItems.values());
  }

  async getAuctionItem(id: string): Promise<AuctionItem | undefined> {
    return this.auctionItems.get(id);
  }

  async createAuctionItem(insertItem: InsertAuctionItem): Promise<AuctionItem> {
    const id = randomUUID();
    const item: AuctionItem = { ...insertItem, id };
    this.auctionItems.set(id, item);
    return item;
  }

  async searchAuctionItems(query: string): Promise<AuctionItem[]> {
    if (!query.trim()) return this.getAuctionItems();
    
    const items = Array.from(this.auctionItems.values());
    const searchTerm = query.toLowerCase();
    
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    );
  }

  async filterAuctionItems(filters: {
    conditions?: string[];
    states?: string[];
    facilities?: string[];
    minPrice?: number;
    maxPrice?: number;
  }): Promise<AuctionItem[]> {
    let items = Array.from(this.auctionItems.values());

    if (filters.conditions && filters.conditions.length > 0) {
      items = items.filter(item => filters.conditions!.includes(item.condition));
    }

    if (filters.states && filters.states.length > 0) {
      items = items.filter(item => filters.states!.includes(item.state));
    }

    if (filters.facilities && filters.facilities.length > 0) {
      items = items.filter(item => filters.facilities!.includes(item.facility));
    }

    if (filters.minPrice !== undefined) {
      items = items.filter(item => parseFloat(item.currentPrice) >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      items = items.filter(item => parseFloat(item.currentPrice) <= filters.maxPrice!);
    }

    return items;
  }

  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const location: Location = { ...insertLocation, id };
    this.locations.set(id, location);
    return location;
  }
}

export const storage = new MemStorage();
