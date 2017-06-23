import scrapy
import json
import copy
from functools import partial

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 0
    maxid = 26600 #11389
    #'
    start_urls = map(lambda n: 'https://results.chronotrack.com/embed/results/load-model?modelID=event&eventID=' + str(n) + '', range(start, maxid))

    def parse(self, response, race=None):
        data = {
            'race': {},
            'results': [],
            'url': response.url
        }

        if not race:
            raceid = response.url.split('=')[-1]
            resp = json.loads(response.text[1:-2])
            data['race']['name'] = resp['model']['name']
            data['race']['date'] = resp['model']['start_time']
            data['race']['location'] = resp['model']['location']
            data['race']['time_zone'] = resp['model']['time_zone']
            data['race']['image'] = resp['model']['eventGraphic'].replace('\\/', '/')
            data['race']['url'] = response.url
            for subid, r in resp['model']['races'].iteritems():
                print subid, "------------"
                race2 = copy.copy(data['race'])
                race2['type'] = r['name']
                race2['category'] = r['type']
                b = r['brackets'][0]
                race2['bracket'] = b['name']
                url = ('https://results.chronotrack.com/embed/results/results-grid?sEcho=10&iColumns=11&sColumns=&iDisplayStart=0&iDisplayLength=20000'
                      '+&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2&mDataProp_3=3&mDataProp_4=4&mDataProp_5=5&mDataProp_6=6&mDataProp_7=7'
                      '&mDataProp_8=8&mDataProp_9=9&mDataProp_10=10&raceID='+b['race_id']+'&bracketID='+b['race_default_bracket_id']+'&eventID=' + raceid)
                yield scrapy.Request(url, callback=partial(self.parse, race=race2))
        else:
            data['race'] = race
            data['url'] = race['url']
            del race['url']
            results = json.loads(response.text[1:-2])
            headers = ['id', 'Rank','Name','Bib','Time','Pace','Hometown','Age','Gender','Division','Div Rank']
            data['results'] = list(map(lambda r: dict(zip(headers, r)), results['aaData']))
            yield data
