import scrapy
import json
import copy
from functools import partial
from scrapy.http import FormRequest
from dateutil import parser
import requests

class RaceFind(scrapy.Spider):
    name = 'racefind'

    def start_requests(self):
        for i in range(1, 52):
            for year in range(2018, 2019):
                for m in range(1, 13):
                    yield scrapy.Request('http://race-find.com/races?SelectForm[query]='
                        + '&SelectForm[state]=' + str(i)
                        + '&SelectForm[city]=&SelectForm[date_from]='
                        + str(m) + '/01/'+str(year)+'&SelectForm[date_to]='
                        + str(m) + '/31/'+str(year)+'&SelectForm[type]='
                        + '&race-page=' + str(1))

    def parse(self, response):
        table = response.css('.wrap-search-results-table table')
        for row in table.css('tbody tr'):
            print(row)
            date = row.css('td:nth-child(2)::text').extract_first()
            name = row.css('td:nth-child(3) a::text').extract_first()
            href = row.css('td:nth-child(3) a').xpath('@href').extract_first()
            distances = row.css('td:nth-child(4)::text').extract_first()
            city = row.css('td:nth-child(5)::text').extract_first()
            o = {
                'name': name,
                'date': parser.parse(date, fuzzy=True).isoformat().split('T')[0],
                'distance': ','.join(distances.split('/')),
                'location': city,
                'website': href,
            }
            yield o
        count = int(response.css('.grid-view .summary b:nth-child(2)::text').extract_first())
        parts = response.url.rsplit('=', 1)
        page = int(parts[1])
        if page * 15 < count:
            yield scrapy.Request(parts[0] + '=' + str(page + 1))