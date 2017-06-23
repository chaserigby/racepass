import scrapy
import requests
import re

# CURRENTLY this doesn't seem to get the right date for old past races.

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 1
    maxid = 2121

    download_delay = 0.03
    
    start_urls = ['http://marathons.ahotu.com/calendar/usa?page=1']
    #start_urls = ['http://marathons.ahotu.com/event/red-shoe-run',
    #                'http://marathons.ahotu.com/event/daves-10-miler-5k',
    #                'http://marathons.ahotu.com/event/fanny-freezer']
    #start_urls = map(lambda n: 'http://marathons.ahotu.com/calendar/usa?page=' + str(n), range(start, maxid))
    #start_urls = ['http://marathons.ahotu.com/event/triad-ten-miler']

    def parse(self, response):
        data = {
            'race': {},
            'results': [],
            'url': response.url
        }

        if 'calendar' in response.url: #base page
            for event in response.css('a.calendar'):
                date = event.css('dd span ::text').extract_first()
                link = response.urljoin(event.xpath('@href').extract_first())
                if '2017' in date
                    yield scrapy.Request(link)
        else:
            data['race']['state'] = response.css('.breadcrumb').xpath('.//li[4]/a/text()').extract_first()
            data['race']['city'] = response.css('.breadcrumb').xpath('.//li[5]/text()').extract_first()
            data['race']['description'] = response.css('.description').extract_first()
            data['race']['date'] = response.css('.calendar dd span').xpath('@datetime').extract_first()  
            data['race']['name'] = response.css('h1 span:first-child::text').extract_first()  

            runsignup = response.css('.calendar a.btn').xpath('@href').extract_first() 
            website = response.css('.thumbnail a').xpath('@href').extract_first()

            time = response.css('.calendar').xpath('.//dd[2]/text()').extract_first() 
            rtype = response.css('.calendar').xpath('.//dd[3]/text()').extract_first() 

            if rtype and 'Cut off' in rtype:
                rtype = response.css('.calendar').xpath('.//dd[4]/text()').extract_first() 

            if website:
                r = requests.head(response.urljoin(website), allow_redirects=True)
                website = r.url

            data['race']['website'] = runsignup or website
            data['race']['times'] = {}

            if rtype:
                rtype = rtype.split('-')[0].strip()
                match = re.search('\((.*)\)', time)
                if match:
                    time = match.group(1)
                data['race']['times'][rtype] = time

            for row in response.css('table.top-buffer tr'):
                key = ''.join(row.xpath('td[1]//text()').extract()).strip()
                if key:
                    value = ''.join(row.xpath('td[2]//text()').extract()).strip()
                    data['race']['times'][key] = value
            yield data