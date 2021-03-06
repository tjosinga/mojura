require 'ubbparser'
require 'webapp/mojura/lib/locale'

module MojuraWebApp

	class AdvancedSettingsView < BaseView

		def initialize(options = {})
			api_options = {}

			data = {settings: {}}
			api_result = WebApp.api_call('settings', api_options)
			api_result.each { | level, categories |
				level_hash = level_to_as_hash(level)
					categories.each { | category, settings|
					unless data[:settings].include?(category)
						data[:settings][category] = {category: category, keyvalues: []}
					end
					settings.each { |k, v|
						id = "#{category}_#{level}_#{k}"
						t = (v.is_a?(Boolean)) ? Boolean.to_s : v.class.to_s
						values = type_to_as_hash(v)
						values.merge!(level_hash)
						values.merge!({id: id, level: level, key: k, value: v, type: t})
						data[:settings][category][:keyvalues].push(values)
					}
				}
			}
			data[:settings] = data[:settings].values
			data[:settings].each { | values |
				values[:keyvalues].sort!{ | a, b | a[:key] <=> b[:key] }
			}
			data[:datatypes] = %w(String Boolean Integer Float) # Hash Array)
			super(options, data)

			WebApp.page.include_template_file('template-advancedsettings-row', 'webapp/views/advancedsettings/view_row.mustache')
			WebApp.page.include_template_file('template-advancedsettings-add', 'webapp/views/advancedsettings/view_add.mustache')
			WebApp.page.include_template_file('template-advancedsettings-delete', 'webapp/views/advancedsettings/view_delete.mustache')
			WebApp.page.include_locale(:advancedsettings)
			WebApp.page.include_locale(:system)
		end

		def render(*args)
			if WebApp.current_user.administrator?
				return super
			else
				return render_no_rights
			end
		end

		def level_to_as_hash(level)
			{
				is_private: (level == :private),
				is_protected: (level == :protected),
				is_public: (level == :public)
			}
		end

		def type_to_as_hash(val)
			result = {
				as_boolean: val.is_a?(TrueClass) || val.is_a?(FalseClass),
				as_integer: val.is_a?(Fixnum),
				as_float: val.is_a?(Float)
			}
			result[:as_string] = !result.has_value?(true) # if nothing else, show as string
			return result
		end

		WebApp.register_view('advancedsettings', AdvancedSettingsView, :min_col_span => 3)

	end

end