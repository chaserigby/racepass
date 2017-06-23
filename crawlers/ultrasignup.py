import scrapy
import json
import copy
from functools import partial

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 0
    maxid = 43550 #11389
    #'
    start_urls = map(lambda n: 'http://ultrasignup.com/results_event.aspx?did=' + str(n) + '', range(start, maxid))

    def parse(self, response, race=None):
        data = {
            'race': {},
            'results': [],
            'url': response.url
        }

        if 'results_event' in response.url:
            raceid = response.url.split('=')[1]
            data['race']['name'] = ' '.join(response.css('h1 ::text').extract()).strip()
            data['race']['date'] = response.css('#lblDate ::text').extract_first()
            data['race']['location'] = response.css('.subtitle::text').extract_first()
            data['race']['type'] = response.css('.distances ::text').extract_first()
            data['race']['image'] = response.css('#event-image').xpath('.//img/@src').extract_first()
            data['race']['url'] = response.url
            url = 'http://ultrasignup.com/service/events.svc/results/'+raceid+'/json?_search=false&rows=20000&page=1&sidx=status+asc%2C+&sord=asc'
            yield scrapy.Request(url, headers={'Accept':'application/json'}, callback=partial(self.parse, race=data['race']))
        else:
            data['race'] = race
            data['url'] = race['url']
            del race['url']
            data['results'] = json.loads(response.text)
            yield data
