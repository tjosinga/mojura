require 'webapp/views/news/view_list'
require 'webapp/views/news/view_article'
require 'webapp/views/news/view_overview'

module MojuraWebApp

	class NewsView < BaseView

		def render
			type = @options[:type]
			newsid = WebApp.page.request_params[:newsid]
			if type == 'list'
				view = NewsListView.new(@options)
			elsif (type == 'overview') || (newsid.nil?)
				view = NewsOverviewView.new(@options)
			else
				view = NewsArticleView.new(@options)
			end
			return view.render
		end

		WebApp.register_view('news', NewsView)

	end


end