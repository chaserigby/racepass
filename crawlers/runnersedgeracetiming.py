import scrapy
import json
import copy
from functools import partial

#def get_start():
#    start_date = 
#    return (start_date + timedelta(n) for n in range(day_count))

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 7850
    maxid = 25000
    #'
    start_urls = map(lambda n: 'http://www.runningintheusa.com/Race/View.aspx?RaceID=' + str(n) + '', range(start, maxid))

    def parse(self, response, race=None):
        data = {
            'race': race or {},
        }

        mapping = {
            'Race Date:': 'date',
            'City, State:': 'location',
            'Race Website:': 'website',
            'Events:': 'types',
            'Listing Status:': 'status',
            'Added To Our Directory:': 'date_added',
            'Listing Last Updated:': 'date_updated',
            'Link Last Checked:': 'date_last_checked',
        }
        mapping_value_index = {
            'Race Website:': 1,
            'Listing Status:': 1,
        }

        if race == None:
            raceid = response.url.split('=')[1]
            data['race']['url'] = response.url
            data['race']['name'] = ' '.join(response.css('#ctl00_lblPageTitle ::text').extract()).strip()
            for row in response.css('table[cellpadding="6"] tr  '):
                key = row.css('td:first-child ::text').extract_first()
                if key in mapping:
                    actual_key = mapping[key]
                    if key == 'Race Website:':
                        value = row.xpath('.//td/a/@href').extract_first()
                    else:
                        value = row.css('td:nth-child(2) ::text').extract()[mapping_value_index[key] if key in mapping_value_index else 0]
                    data['race'][actual_key] = value.replace('&nbsp','').strip()
            if 'race not found' not in data['race']['name']:
                url = 'http://www.runningintheusa.com/Race/' + data['race']['website']
                yield scrapy.Request(url, headers={'Referer': response.url}, callback=partial(self.parse, race=data['race']))
        else:
            data['race']['website'] = response.url
            yield data
            
