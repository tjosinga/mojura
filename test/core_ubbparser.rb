$:.unshift File.join(File.dirname(__FILE__), '..')

require 'test/unit'
require 'ubbparser'
require 'api/lib/ubbparser_additions'

module MojuraAPI

	class UBBParserTester < Test::Unit::TestCase

		def test_in_array
			assert_equal('This is a <strong>test</strong>', UBBParser.parse('This is a [b]test[/b]'))
			assert_equal('<strong>test</strong>', UBBParser.parse('[b]test[/b]'))
			assert_equal('This is a <strong><em>test</em></strong>', UBBParser.parse('This is a [b][i]test[/i][/b]'))
			assert_equal('This is <a href=\'http://www.moda.nl\' class=\'ubb-url\' target=\'_blank\'>www.moda.nl</a> a <strong>test</strong>.', UBBParser.parse('This is [url]www.moda.nl[/url] a [b]test[/b].'))
			assert_equal('just [something] unknown', UBBParser.parse('just [something] unknown'))
			assert_equal('<a href=\'http://www.mojura.nl\' class=\'ubb-url\' target=\'_blank\'>http://www.mojura.nl</a>', UBBParser.parse('[url]http://www.mojura.nl[/url]'))
			assert_equal('<a href=\'http://www.mojura.nl\' class=\'ubb-url\' target=\'_blank\'>Mojura</a>', UBBParser.parse('[url=http://www.mojura.nl]Mojura[/url]'))
			assert_equal('<a href=\'mailto:info@mojura.nl\' class=\'ubb-email\'>info@mojura.nl</a>', UBBParser.parse('[email]info@mojura.nl[/email]', {protect_email: false}))
			assert_equal('<a href=\'mailto:info@mojura.nl\' class=\'ubb-email\'>Mojura</a>', UBBParser.parse('[email=info@mojura.nl]Mojura[/email]', {protect_email: false}))
			assert_equal('<span class=\'ubb-email ubbparser-error\'>UBB error: invalid email address info@1.n</span>', UBBParser.parse('[email=info@1.n]Mojura[/email]'))
			assert_equal('<iframe src=\'http://www.google.com\' class=\'ubb-iframe\'></iframe>', UBBParser.parse('[iframe]http://www.google.com[/iframe]'))
		end

	end

end