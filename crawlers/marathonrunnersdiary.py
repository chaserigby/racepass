#http://www.rrca.org/calendar/find-event?RecordID=9920&PageID=8&PrevPageID=2&cpipage=78

import scrapy
import html2text
from functools import partial
from dateutil import parser

h = html2text.HTML2Text()
h.ignore_links = True

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 0
    maxid = 900
    
    start_urls = [
        'http://www.marathonrunnersdiary.com/races/uk-marathon-list.php',
        'http://www.marathonrunnersdiary.com/races/europe-marathons-list.php',
        'http://www.marathonrunnersdiary.com/races/international-marathons-list.php',
    ]

    def parse(self, response, race=None):
        data = {
            'race': race or {},
            'url': response.url
        }
        
        if 'marathons/' not in response.url:
            for event in response.css('div[itemtype="http://schema.org/Event"]'):
                data['race'] = {}
                data['race']['datetime'] = event.xpath('.//div[@class="leftdate"]/meta/@content').extract_first()
                data['race']['name'] = event.xpath('.//div[@class="leftrace"]/a/span/text()').extract_first()
                data['race']['city'] = event.xpath('.//div[@class="leftcity"]/text()').extract_first()
                if response.url == 'http://www.marathonrunnersdiary.com/races/uk-marathon-list.php':
                    data['race']['country'] = 'United Kingdom'
                else:
                    data['race']['country'] = event.xpath('.//div[@class="leftregion"]/text()').extract_first()
                    
                data['race']['url'] = response.urljoin(event.xpath('.//a/@href').extract_first())
                yield scrapy.Request(data['race']['url'], callback=partial(self.parse, race=data['race']))
                #yield data
        else:
            parsed = h.handle(response.text)
            #data['race']['website'] = response.css('.pages_post_communicate div p:last-child').xpath('.//a/@href').extract_first()
            entrynext = False
            for line in parsed.split('\n'):
                if entrynext:
                    data['race']['price'] = line.strip()
                    entrynext = False
                if 'entry' in line.lower() and 'price' not in data['race']:
                    entrynext = True

                if 'Start Time' in line:
                    time = line.split('**')[2].strip().replace('.', ':')
                    if time != 'TBC' and data['race']['datetime']:
                        try:
                            data['race']['datetime'] = parser.parse(data['race']['datetime'] + ' ' + time, fuzzy=True).isoformat()
                        except:
                            print('Cannot parse ' + data['race']['datetime'] + ' ' + time)
                    elif data['race']['datetime']:
                        data['race']['datetime'] = parser.parse(data['race']['datetime']).isoformat()

                if 'Website' in line:
                    data['race']['website'] = line.split('**')[2].strip()
                if 'Number of Places' in line:
                    data['race']['expected_places'] = line.split('**')[2].strip()
                if 'Contact' in line and not 'Info' in line and 'us' not in line.lower():
                    #print(line)
                    data['race']['organization'] = line.split('**')[2].strip()
            if data['race']['datetime']:
                yield data['race']