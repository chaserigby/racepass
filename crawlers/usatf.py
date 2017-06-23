import scrapy
from functools import partial

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    
    #start_urls = [
    #    'http://www.usatf.org/calendars/searchResults.asp?city=&state=&country=&associationNumber=&show=25&page=2'
        #'http://www.usatf.org/calendars/searchResults_info.asp?eventID=C17002577'
    #]
    start_urls = map(lambda n: 'http://www.usatf.org/calendars/searchResults.asp?city=&state=&country=&associationNumber=&startDate=01%2F01%2F2017&endDate=12%2F31%2F2017&eventType=R&ageGroup=O&includeAllAges=ON&distanceSelection=other&distance=&distanceUnits=&distanceComparison=%3D&prizePurse=&name=&series=&submit=Search&page=' + str(n), range(1, 65))

    def parse(self, response, data=None):
        if 'searchResults_info' in response.url:
            text = response.css('.contact ::text').extract()
            email_parts = response.css('.contact').xpath('a/@href').extract_first().split('\'')[1].split(';')
            email_parts.reverse()
            email = '@'.join(email_parts)
            data['name'] = text[1]
            data['phone'] = text[3].split(': ')[1]
            data['email'] = email
            data['website'] = response.css('.media').xpath('.//a/@href').extract_first()
            data['description'] = response.css('.details tr td p:last-child::text').extract_first()
            yield data
        else:
            for row in response.css('.calendar tr'):
                #eid = row.xpath('@id').extract_first()
                eid = row.css('td:nth-child(3)').xpath('.//a/@href').extract_first()
                if eid:
                    eid = eid.split('\'')[1]
                if eid:
                    data = {
                        'date': row.css('td:first-child ::text').extract_first(),
                        'event name': row.css('td:nth-child(3) a::text').extract_first(),
                        'location': row.css('td:nth-child(4)::text').extract_first(),
                        'events': row.css('td:nth-child(5)::text').extract_first().strip(),
                    }
                    yield scrapy.Request('http://www.usatf.org/calendars/searchResults_info.asp?eventID=' + eid, callback=partial(self.parse, data=data))
     