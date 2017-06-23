#http://www.rrca.org/calendar/find-event?RecordID=9920&PageID=8&PrevPageID=2&cpipage=78

import scrapy
import caspio

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 1
    maxid = 2
    
    download_delay = 3

    #start_urls = ['http://www.rrca.org/calendar/find-event?PageID=8&cbRecordPosition=11']
    #start_urls = [] #['https://b5.caspio.com/dp.asp?cbqe=QXBwS2V5PWYyYzgzMDAwNzA4ZjIwOGFmM2RmNDA1YWJjNTUmZG90bmV0PXRydWUmanM9dHJ1ZSZwYXRobmFtZT1odHRwOi8vd3d3LnJyY2Eub3JnL2NhbGVuZGFyL2ZpbmQtZXZlbnQmYXBwU2Vzc2lvbj0xMTg5NzgyNTkzNjQzNjE1MjA1ODgwNjgzNjkzOTE1Njk2Mjc1NDAwNzk1ODc3NjE2MzAzODQxMjc1NjgwNjA4Nzk0MTQ0MzgwNTMwODIwMjg5MTY0Njg3MjMyNTkyMDIzMzE1NjgxODE4NTM1Njc0ODYwNDA2NTg3MjAxOTU3NSZSZWNvcmRJRD05MDAxJmNwaXBhZ2U9JlBhZ2VJRD04JlByZXZQYWdlSUQ9OCZDUElTb3J0VHlwZT0mQ1BJb3JkZXJCeT0mY2JSZWNvcmRQb3NpdGlvbj0xMw==&cbEmbedTimeStamp=1484998106713%27']
    #start_urls = map(lambda n: 'http://www.pseresults.com/events/' + str(n) + '/results/', range(start, maxid))

    def gen_url(i):
        return 'https://b5.caspio.com/dp.asp?id=' + str(i) + '&' + str(caspio.PyJsHoisted_f_cbload_('f2c83000708f208af3df405abc55&amp;dotnet=true','https:', str(i)))[1:]

    start_urls = map(gen_url, range(start, maxid))

    def parse(self, response):
        data = {
            'race': {},
            'url': response.url
        }
        
        html = response.text[16:-3].replace('\\"', '"')
        html = html.replace('\\n', '\n')
        response = scrapy.Selector(text=html, type="html")
        print(html)

        data['race']['img'] = response.css('table[data-cb-name="cbTable"]').xpath('.//img/@src').extract_first()

        if data['race']['img']:
            data['race']['img'] = data['race']['img'].replace('\\', '')

        for row in response.css('table[data-cb-name="cbTable"] tr'):
            key = ''.join(row.xpath('.//td[1]//text()').extract()).strip()
            if key and key != "\\n":
                value = ''.join(row.xpath('.//td[2]//text()').extract()).strip()
                data['race'][key] = value
        print(data)
        yield data