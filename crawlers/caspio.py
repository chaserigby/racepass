__all__ = ['caspio']

# Don't look below, you will not understand this Python code :) I don't.

from js2py.pyjs import *
# setting scope
var = Scope( JS_BUILTINS )
set_global_object(var)

# Code follows:
var.registers(['f_cbload'])
@Js
def PyJsHoisted_f_cbload_(appKey, protocol, record, this, arguments, var=var):
    var = Scope({'appKey':appKey, 'arguments':arguments, 'this':this, 'record':record, 'protocol':protocol}, var)
    var.registers(['v_queryString', 'protocol', 'record', 'l', 'appKey', 'v_winloc_search'])
    @Js
    def PyJs_anonymous_1_(a, this, arguments, var=var):
        var = Scope({'this':this, 'arguments':arguments, 'a':a}, var)
        var.registers(['f', 'c', 'b', 'd', 'a', 'h', 'g', 'n', 'e'])
        var.put('b', Js(''))
        var.put('h', Js(0.0))
        #for JS loop
        var.put('a', var.get('l').callprop('_utf8_encode', var.get('a')))
        while (var.get('h')<var.get('a').get('length')):
            def PyJs_LONG_2_(var=var):
                return PyJsComma(PyJsComma(PyJsComma(PyJsComma(PyJsComma(PyJsComma(PyJsComma(PyJsComma(var.put('d', var.get('a').callprop('charCodeAt', (var.put('h',Js(var.get('h').to_number())+Js(1))-Js(1)))),var.put('c', var.get('a').callprop('charCodeAt', (var.put('h',Js(var.get('h').to_number())+Js(1))-Js(1))))),var.put('e', var.get('a').callprop('charCodeAt', (var.put('h',Js(var.get('h').to_number())+Js(1))-Js(1))))),var.put('f', (var.get('d')>>Js(2.0)))),var.put('d', (((var.get('d')&Js(3.0))<<Js(4.0))|(var.get('c')>>Js(4.0))))),var.put('g', (((var.get('c')&Js(15.0))<<Js(2.0))|(var.get('e')>>Js(6.0))))),var.put('n', (var.get('e')&Js(63.0)))),(var.put('g', var.put('n', Js(64.0))) if var.get('isNaN')(var.get('c')) else (var.get('isNaN')(var.get('e')) and var.put('n', Js(64.0))))),var.put('b', ((((var.get('b')+var.get(u"this").get('_keyStr').callprop('charAt', var.get('f')))+var.get(u"this").get('_keyStr').callprop('charAt', var.get('d')))+var.get(u"this").get('_keyStr').callprop('charAt', var.get('g')))+var.get(u"this").get('_keyStr').callprop('charAt', var.get('n')))))
            PyJs_LONG_2_()
        
        return var.get('b')
    PyJs_anonymous_1_._set_name('anonymous')
    @Js
    def PyJs_anonymous_3_(a, this, arguments, var=var):
        var = Scope({'this':this, 'arguments':arguments, 'a':a}, var)
        var.registers(['c', 'b', 'd', 'a'])
        var.put('a', var.get('a').callprop('replace', JsRegExp('/\\r\\n/g'), Js('\n')))
        #for JS loop
        var.put('b', Js(''))
        var.put('d', Js(0.0))
        while (var.get('d')<var.get('a').get('length')):
            try:
                var.put('c', var.get('a').callprop('charCodeAt', var.get('d')))
                def PyJs_LONG_4_(var=var):
                    return PyJsComma((var.put('b', var.get('String').callprop('fromCharCode', ((var.get('c')>>Js(6.0))|Js(192.0))), '+') if ((Js(127.0)<var.get('c')) and (Js(2048.0)>var.get('c'))) else PyJsComma(var.put('b', var.get('String').callprop('fromCharCode', ((var.get('c')>>Js(12.0))|Js(224.0))), '+'),var.put('b', var.get('String').callprop('fromCharCode', (((var.get('c')>>Js(6.0))&Js(63.0))|Js(128.0))), '+'))),var.put('b', var.get('String').callprop('fromCharCode', ((var.get('c')&Js(63.0))|Js(128.0))), '+'))
                (var.put('b', var.get('String').callprop('fromCharCode', var.get('c')), '+') if (Js(128.0)>var.get('c')) else PyJs_LONG_4_())
            finally:
                    (var.put('d',Js(var.get('d').to_number())+Js(1))-Js(1))
        return var.get('b')
    PyJs_anonymous_3_._set_name('anonymous')
    PyJs_Object_0_ = Js({'_keyStr':Js('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='),'encode':PyJs_anonymous_1_,'_utf8_encode':PyJs_anonymous_3_})
    var.put('l', PyJs_Object_0_)
    var.put('v_winloc_search', (Js('appSession=11897825936436152058806836939156962754007958776163038412756806087941443805308202891646872325920233156818185356748604065872019575&RecordID=9001&cpipage=&PageID=8&PrevPageID=8&CPISortType=&CPIorderBy=&cbRecordPosition=')+var.get('record')))
    var.put('appKey', (var.get('appKey') or Js('')).callprop('replace', JsRegExp('/&amp;/g'), Js('&')).callprop('replace', JsRegExp('/&lt;/g'), Js('<')).callprop('replace', JsRegExp('/&gt;/g'), Js('>')).callprop('replace', JsRegExp('/&quot;/g'), Js('"')).callprop('replace', JsRegExp('/&#39;/g'), Js("'")))
    var.put('v_queryString', ((((Js('AppKey=')+var.get('appKey'))+Js('&js=true'))+Js('&pathname=http://www.rrca.org/calendar/find-event&'))+var.get('v_winloc_search')))
    return (((Js('cbqe=')+var.get('l').callprop('encode', var.get('v_queryString')))+Js('&cbEmbedTimeStamp='))+var.get('Date').create().callprop('valueOf'))
PyJsHoisted_f_cbload_.func_name = 'f_cbload'
var.put('f_cbload', PyJsHoisted_f_cbload_)
pass
pass
pass


# Add lib to the module scope
caspio = var.to_python()