import scrapy
import json
import copy
from functools import partial
from scrapy.http import FormRequest
from dateutil import parser
from geopy.geocoders import Nominatim
geolocator = Nominatim()
import requests

def locationParse(o, r):
    a = ''
    for c in r['address_components']:
        t = c['types'][0]
        if t == 'street_number' or t == 'route' or t == 'premise':
            a += c['long_name'] + ' '
        if t == 'locality':
            o['city'] = c['long_name']
        if t == 'administrative_area_level_1':
            o['state'] = c['short_name']
        if t == 'country':
            o['country'] = c['short_name']
        if t == 'postal_code':
            o['zip'] = c['long_name']
    o['address'] = a
    o['coordinates'] = json.dumps(r['geometry']['location'])

class RaceMine(scrapy.Spider):
    name = 'racemine'

    #start_urls = ['https://raceroster.com/search/upcoming-events?q=5k&interpret=1&force-location=0&p=41&advanced-start-date=02%2F16%2F2017&advanced-end-date=10%2F07%2F2017']
    start_urls = ['https://racemine.com/confluence-running-company/events/2017/parade-day-mile#Event-Information']

    def start_requests(self):
        for i in range(1, 21):
            yield FormRequest(url='https://www.racemine.com/search',
                formdata={
                'q':'',
                'page':str(i)},
                headers={'X-Requested-With':'XMLHttpRequest'})

    def parse(self, response):
        o = {}


        if '/search' in response.url:
            print('-----------------')
            for link in response.css('h2 a').xpath('@href').extract():
                alink = response.urljoin(link)
                yield scrapy.Request(alink)
            return
 
        o['url'] = response.url
        date = response.css('[itemprop="startDate"]').xpath('@content').extract_first()
        o['datetime'] = parser.parse(date, fuzzy=True).isoformat()
        loc = ''.join(response.css('[itemprop="location"] ::text').extract()).strip()
        o['address'] = loc
        o['images'] = response.css('[itemprop="image"]').xpath('@src').extract()
        o['organization'] = response.css('[itemtype="http://schema.org/Organization"] [itemprop="name"]::text').extract_first()
        o['name'] = ''.join(response.css('h1[itemprop="name"]::text').extract()).strip()
        o['website'] = response.css('.meta__list-item--website a').xpath('@href').extract_first()

        for row in response.css('div.fs20px p'):
            if row.css('.fa-external-link-square').extract():
                o['website'] = row.css('a').xpath('@href').extract_first()
            if row.css('.fa-envelope').extract():
                o['contact_email'] = row.css('a::text').extract_first()
            if row.css('.fa-phone').extract():
                o['contact_phone'] = ''.join(row.css('::text').extract())

#        yield scrapy.Request('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDOZ8hCqFBA-vK2S5rt2eOJm_6FS36N2fE&address='+loc, meta={'data': o})
        r = requests.get('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDOZ8hCqFBA-vK2S5rt2eOJm_6FS36N2fE&address='+loc)
        gdata = r.json()

        if gdata['status'] == 'OK':
            locationParse(o, gdata['results'][0])
        else:
            print(gdata)
            o['address'] = loc

        for product in response.css('[itemtype="http://schema.org/Product"] .row'):
            o2 = copy.copy(o)
            o2['type'] = product.css('[itemprop="name"]::text').extract_first()
            o2['price'] = product.css('[itemprop="priceCurrency"]::text').extract_first() + product.css('[itemprop="price"]::text').extract_first()
            yield o2