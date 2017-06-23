import scrapy
import json
import copy
from functools import partial
from scrapy.http import FormRequest
from dateutil import parser

class ImAthlete(scrapy.Spider):
    name = 'imathlete'

    start_urls = ['https://www.imathlete.com/events/EventReg/EventReg_SelectType.aspx?fEID=39231&fNew=1&fsource=imASearch']


    def start_requests(self):
        yield scrapy.Request('http://www.imathlete.com/events/services/Events.asmx/GetSearchResults?z=1486700485836', method='POST', 
         body='{"inCat1":"Running","inCat2":"","inCat3":"","inLocCon":"","inLocCID":"0","inLocSID":"0","inLocCity":"","inDate":"1/1/0001 00:00:00","inName":"5k","inCID":0,"inPage":1,"inRecsPerPage":300,"inSort":"da","inZipCodeSearch":"","inZipCodeSearchRange":0,"inUserID":"0","inIPAddress":"208.112.101.5","inIncludePastEvents":false,"inIncludeClosedEvents":false,"inAPIAccess":false}',
          headers={'X-Requested-With':'XMLHttpRequest', 'Content-Type': 'application/json '})


    def parse(self, response):
        if 'EventDetails' in response.url:
            o = response.meta['data']
            for line in response.text.split('\n'):
                if 'var sContactsXML' in line:        
                    html = line[20:-4].replace('\\t','\t').replace('\\n','\n').replace('\\\'' ,'\'').replace('\/' ,'/')
                    resp = scrapy.Selector(text=html, type="html")
                    o['contact_name'] = (resp.css('EventContactFName::text').extract_first() or '') + ' ' + (resp.css('EventContactLName::text').extract_first() or '')
                    o['contact_email'] = resp.css('EventContactEmailAddress::text').extract_first()
                    o['contact_phone'] = resp.css('EventContactPhone::text').extract_first()
                    o['website'] = resp.css('EventContactURL::text').extract_first()
                    #yield o
            eid = response.meta['eid']
            yield scrapy.Request('https://www.imathlete.com/events/EventReg/EventReg_SelectType.aspx?fEID='+str(eid)+'&fNew=1&fsource=imASearch', meta={'data': o})
        if 'EventReg_SelectType' in response.url:
            o = response.meta['data']
            o['url'] = response.url
            for line in response.text.split('\n'):
                if 'sRegList' in line:
                    html = line[16:-3].replace('\\t','\t').replace('\\n','\n').replace('\\\'' ,'\'').replace('\/' ,'/')
                    resp = scrapy.Selector(text=html, type="html")
                    for row in resp.css('tr'):
                        o['type'] = row.css('.name label::text').extract_first();
                        o['price'] = row.css('.fee::text').extract_first();
                        yield o

        elif 'GetSearch' in response.url:
            results = json.loads(response.text)
            for d in results['d']:
                eid = d['EventID']
                o = {
                    'source': 'imathlete',
                    'name': d['EventName'],
                    'category': d['Sports'][0]['Level2Name'],
                    'city': d['EventCity'],
                    'state': d['EventState'],
                    'country': d['EventCountry'],
                    'description': d['EventOverview'],
                    'images': ['http://www.imathlete.com/data/GetPhoto.aspx?fEID='+str(eid)+'&fLogo=1&z=1486715204164'],
                    'expected_places': d['Participants'],

                }
                o['datetime'] = parser.parse(d['EventDate'], fuzzy=True).isoformat()
                yield scrapy.Request('http://www.imathlete.com/events/EventDetails.aspx?fEID='+str(eid)+'&fNew=1&fsource=imASearch', meta={'eid': eid, 'data': o})
                