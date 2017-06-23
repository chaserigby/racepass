import scrapy
import json
import copy
from functools import partial

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 0
    maxid = 240 #11389
    #'
    start_urls = map(lambda n: 'http://www.databarevents.com/events/results/' + str(n) + '', range(start, maxid))

    def parse(self, response, race=None):
        data = {
            'race': {},
            'results': [],
            'url': response.url
        }

        data['race']['name'] = ' '.join(response.css('.brand ::text').extract()).strip()
        print response.css('h1::text').extract()
        data['race']['type'] = response.css('h1::text').extract_first().split('-')[0].strip()[12:]
        data['race']['date'] = response.css('h1::text').extract_first().split('-')[1].strip()

        headers = []
        for th in response.css('table tr th'):
            h = ''.join(th.xpath('.//text()').extract()).strip()
            headers.append(h)
        for row in response.css('table tr'):
            racer = {}
            for i, td in enumerate(row.css('td')):
                value = ''.join(td.css('::text').extract()).strip()
                racer[headers[i]] = value
            data['results'].append(racer)
        yield data
