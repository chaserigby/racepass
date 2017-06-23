import scrapy
import json
import copy
from functools import partial
from scrapy.http import FormRequest
from dateutil import parser
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

class RaceRoster(scrapy.Spider):
    name = 'raceroster'

    #start_urls = ['https://raceroster.com/search/upcoming-events?q=5k&interpret=1&force-location=0&p=41&advanced-start-date=02%2F16%2F2017&advanced-end-date=10%2F07%2F2017']
    #start_urls = ['https://raceroster.com/11498']

    def start_requests(self):
        for i in range(150, 12500):
            yield scrapy.Request('https://raceroster.com/'+str(i))

    def parse(self, response):
        o = {}
        o['url'] = response.url
        o['datetime'] = response.css('.meta__list-item--time').xpath('time/@datetime').extract_first()
        loc = response.css('.meta__list-item--location a::text').extract_first().strip()
        """loc_parts = loc.split(',', 1)
        print(loc_parts)
        o['address'] = loc_parts[0]
        o['city'] = loc_parts[1][:-3]
        o['state'] = loc_parts[1][-2:]"""
        o['images'] = response.css('.brand__wrap img').xpath('@src').extract()
        o['name'] = response.css('.banner__text-container h1::text').extract_first()
        o['subtitle'] = response.css('.banner__text-container h2::text').extract_first() 
        o['address'] = loc
        o['website'] = response.css('.meta__list-item--website a').xpath('@href').extract_first()
        o['contact_name'] = response.css('.contact__name-value p::text').extract_first()
        o['contact_email'] = response.css('.contact__email-value p::text').extract_first()
        o['contact_phone'] = response.css('.contact__phone-value p::text').extract_first()
        o['contact_website'] = (response.css('.contact__website-value a').xpath('@href').extract_first() or '').strip()       

        o['charity'] = (response.css('.list-of-charities li a::text').extract_first() or '').strip()

        r = requests.get('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDOZ8hCqFBA-vK2S5rt2eOJm_6FS36N2fE&address='+loc)
        gdata = r.json()

        if gdata['status'] == 'OK':
            locationParse(o, gdata['results'][0])
        else:
            loc2 = loc.split(',', 1)[-1]
            r2 = requests.get('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDOZ8hCqFBA-vK2S5rt2eOJm_6FS36N2fE&address='+loc2)
            gdata2 = r.json()

            if gdata2['status'] == 'OK':
                locationParse(o, gdata2['results'][0])

        for table in response.css('.registration-fees__event-container'):
            o2 = copy.copy(o)
            o2['type'] = table.css('h4::text').extract_first().strip()
            o2['price'] = table.css('.registration-fees__price-amount::text').extract_first().strip()
            yield o2