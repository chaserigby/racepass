import scrapy
import json
import copy
from functools import partial
from scrapy.http import FormRequest
from dateutil import parser

class RaceEntry(scrapy.Spider):
    name = 'RaceEntry'

    #start_urls = map(lambda n: 'http://ultrasignup.com/results_event.aspx?did=' + str(n) + '', range(start, maxid))

    #start_urls = ['https://www.raceentry.com/race-reviews/earth-day-5k-and-10k']
    #start_urls = ['https://www.raceentry.com/races/fierce-fiesta-5k-/2017/register']

    def start_requests(self):
        for i in range(1, 163):
            yield FormRequest(url='https://www.raceentry.com/get-races',
                formdata={
                'search':'',
                'num_results':'25',
                'sort_name':'',
                'sort_order':'ASC',
                'page':str(i)},
                headers={'X-Requested-With':'XMLHttpRequest'})

            #yield scrapy.Request('https://www.raceentry.com/get-races?page='+str(i), method='POST', 
            #                      body='search=&num_results=25&sort_name=&sort_order=ASC&page='+str(i),
            #                      headers={'X-Requested-With':'XMLHttpRequest'})

    def parse(self, response, race=None):
        if 'race-reviews' in response.url:
            o = {
                'url': response.url
            }
            o['name'] = response.css('h1::text').extract_first()
            o['description'] = ' '.join(response.css('.col-md-8 .row:nth-child(4) .col-sm-12 ::text').extract()).strip()
            o['contact_name'] = response.css('small [itemprop="name"]::text').extract_first()
            o['contact_email'] = response.css('[itemprop="sponsor"] + div + div small::text').extract_first()
            o['website'] = response.css('.col-sm-10 [itemprop="url"]::text').extract_first()
            o['city'] = response.css('[itemprop="addressLocality"]::text').extract_first()
            o['state'] = response.css('[itemprop="addressRegion"]::text').extract_first()
            date = response.css('[itemprop="startDate"]::text').extract_first().split(' (')[0]
            o['date'] = parser.parse(date, fuzzy=True).isoformat()
            o['images'] = [response.css('[itemprop="image"]').xpath('@src').extract_first()]
            eid = response.url.split('/')[-1]
            yield scrapy.Request('https://www.raceentry.com/races/'+eid+'/2017/register', meta={'data': o})
            #print(o)
        elif 'races/' in response.url:
            #print(response.meta)
            o = response.meta['data']
            #o = {}
            count = 0
            for option in response.css('.category_container .radio'):
                print(option)
                count += 1
                price_text = ''.join(option.css('label::text').extract())
                if ' - ' in price_text:
                    o['price'] = price_text.split(' - ')[1].strip()
                    o['type'] = price_text.split(' - ')[0].strip()
                else:
                    o['type'] = price_text
                    o['price'] = 'None'
                yield o
            if count == 0:
                o['type'] = response.css('#header_race_name::text').extract_first()
                o['price'] = None
                yield o
            #print(response.text)
        else:
            results = json.loads(response.text)
            html = results['data'].replace('\\t','\t').replace('\\n','\n').replace('\/' ,'/')
            response = scrapy.Selector(text=html, type="html")
            for link in response.css('.table_item_race_name a').xpath('@href').extract():
                yield scrapy.Request(link)
                #print(link)