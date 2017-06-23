import scrapy
import json
import copy
from functools import partial
from dateutil import parser

class BlogSpider(scrapy.Spider):
    name = 'runsignup'
    download_delay = 0.25

    #start_urls = ['https://runsignup.com/Race/FL/DaytonaBeach/DaytonaBeachHalf']
    #start_urls=['https://runsignup.com/Race/NY/Bronx/ToughLoveValentinesRelay']
    #start_urls=['https://runsignup.com/Race/FL/Sebring/HeartlandTri']

    start_urls = map(lambda n: 'https://runsignup.com/Races?s=&name=&num=250&page=' + str(n), range(1, 27))

    def parse(self, response, race=None):
        o = {}
        print(response.url)
        if 'race/' in response.url.lower():
            #date = response.css('.runnerUISubHeading ::text').extract_first().strip().split(' ', 1)[1]

            #parser.parse(data['race']['datetime'] + ' ' + time, fuzzy=True).isoformat()
            o['url'] = response.url
            o['name'] = ' '.join(response.css('.runnerUITitle ::text').extract()).strip()
            #o['date'] = date
            o['city'] = response.css('[itemprop="addressLocality"] ::text').extract_first()
            o['state'] = response.css('[itemprop="addressRegion"] ::text').extract_first()
            o['country'] = response.css('[itemprop="addressCountry"] ::text').extract_first()
            o['zip'] = response.css('[itemprop="postalCode"] ::text').extract_first()
            #o['address'] = response.css('.directions').xpath('a@href').extract_first()
            o['category'] = response.css('.runnerUIPrimaryDetails > span:nth-child(6) ::text').extract_first()
            o['image'] = response.css('.runnerUILogo').xpath('.//img/@src').extract_first()
            
            for panel in response.css('.panel'):
                header = panel.css('.panel-title-bold ::text').extract_first().strip()
                if header == 'Place':
                    o['address'] = ', '.join(map(lambda s: s.strip(), panel.css('.panel-body ::text').extract()))
                if header == 'Description':
                    o['description'] = ' '.join(map(lambda s: s.strip(), panel.css('.panel-body ::text').extract()))
                if header == 'Race Website':
                    o['website'] = panel.css('.panel-body a').xpath('@href').extract_first()

            headers = response.css('.data-display2 thead tr th::text').extract()
            def col(text):
                if text not in headers:
                    return 10
                return str(headers.index(text) + 1)

            for event in response.css('.data-display2 tbody tr'):
                o2 = copy.copy(o)
                o2['type'] = event.css('td:nth-child('+col('Event')+') a ::text').extract_first()
                o2['datetime'] = event.css('[itemprop="startDate"]').xpath('@content').extract_first()
                o2['price'] = ''.join(event.css('td:nth-child('+col('Price')+') ::text').extract()).replace('Price', '')
                o2['details'] = event.css('td:nth-child('+col('Details')+') ::text').extract_first()
                
                if o2['price']:
                    o2['price'] = o2['price'].strip()
                if o2['details']:
                    o2['details'] = o2['details'].strip()

                if not o2['datetime']:
                    o2['datetime'] = response.css('.runnerUISubHeading ::text').extract_first().strip()
                if ' ' in o2['datetime']:
                    o2['datetime'] = o2['datetime'].split(' ', 1)[1]

                yield o2
        else:
            for link in response.css('.row-fluid a').xpath('@href').extract():
                if 'Race/' in link:
                    yield scrapy.Request(response.urljoin(link))