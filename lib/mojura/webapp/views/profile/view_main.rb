require 'ubbparser'

module MojuraWebApp

	class ProfileView < BaseView

		def initialize(options = {})
			userid = (options[:userid] || WebApp.page.request_params[:userid] || WebApp.current_user.id).to_s
			api_options = {}
			data = WebApp.api_call("users/#{userid}", api_options)
			if data[:may_update]
				url = Settings.get_b(:use_external_js_libs) ? 'http://crypto-js.googlecode.com/svn/tags/3.0.2/build/rollups/md5.js' : 'ext/crypto-js/md5.js'
				WebApp.page.include_script_link(url)
			end
			super(options, data)
		end

		def safe_email
			UBBParser.parse("[email]#{data[:email]}[/email]")
		end

		def force_old_password
			!WebApp.current_user.administrator?
		end

		def realm
			WebApp.realm
		end

		def render
			super
		end

		WebApp.register_view('profile', ProfileView, :min_col_span => 6)

	end

end