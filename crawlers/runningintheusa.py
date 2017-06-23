

import scrapy
import json
import copy
from functools import partial
import re

#def get_start():
#    start_date = 
#    return (start_date + timedelta(n) for n in range(day_count))

types = ['marathon', 'halfmarathon', '10K', '5K', 'mid', 'trail', 'ultra', 'triathlon', 'duathalon', 'other']
regions = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West']
retype = re.compile('Special=([^&]*)')

class BlogSpider(scrapy.Spider):
    name = 'runningintheusa'
    start = 1
    maxid = 13
    #'
    start_urls = map(lambda n: 'http://www.runningintheusa.com/Race/MapShot.aspx?Rank=Month&Page=1&Month=' + str(n) + '', range(start, maxid))

    def parse(self, response, race=None):
        data = {
            'race': race or {},
        }

        if 'Special' not in response.url:
            for t in types:
                yield scrapy.Request(response.url + '&Special=' + t, callback=self.parse)
        else:
            count = response.css('#ctl00_MainContent_List1_tdIndexRange::text').extract_first()
            if 'limited' in count and 'Region' not in response.url:
                for region in regions:
                    yield scrapy.Request(response.url + '&Region=' + region, callback=self.parse)
            else:
                #print response.url
                race = re.compile('pushPoint\(([0-9\.-]+), ([0-9\.-]+),.*, \'([^<]*)<br>([^<]*) <a href="View.aspx\?RaceID=([0-9]+)">([^<]*)</a>.*\'\);')
                for m in race.findall(response.text):
                    lat, lng, location, date, raceid, name = m
                    t = retype.search(response.url).group(1)
                    data = {
                        'race': {
                            'type': t,
                            'name': name,
                            'lat': lat,
                            'lng': lng,
                            'location': location,
                            'date': date,
                            'url': 'http://runningintheusa.com/Race/View.aspx?RaceID=' + raceid
                        }
                    }
                    yield data
            
