require 'openssl'
require 'crypt/blowfish'
require 'digest/md5'
require 'api/lib/dbobjects'
require 'api/resources/groups/groups.objects'

module MojuraAPI

	class User < DbObject

		def initialize(id = nil)
			super('users', id)
		end

		def load_fields
			yield :username, String, :required => true, :validations => {matches_regexp: /^[a-zA-Z]+[\w\.-]*$/}
			yield :password, String, :required => true, :hidden => true
			yield :email, String, :required => true, :extended_only => true, :validations => {is_email: true}
			yield :firstname, String, :required => true
			yield :infix, String
			yield :lastname, String, :required => true
			yield :is_admin, Boolean, :required => true, :default => false, :extended_only => true
			yield :groupids, Array, :default => [], :hidden => true
			yield :cookie_tokens, Hash, :default => {}, :hidden => true
		end

		# Returns the decrypted digest of the users password
		#
		# @return [String]
		def digest
			return Crypt::Blowfish.new('5t9WXHqboKGMDRZ3').decrypt_string([@fields[:password][:value]].pack('H*')).to_s
		end

		def on_save_data(data)
			if data.include?(:password) && !data[:password].nil?
				data[:password] = Crypt::Blowfish.new('5t9WXHqboKGMDRZ3').encrypt_string(data[:password]).unpack('H*')[0]
				@fields[:password][:value] = data[:password]
			end
		end

		def groups
			groupids = @fields[:groupids]
			return Groups.new(groupids)
		end

		def has_object_right(orig_right, object_userid, object_groupid, object_right)
			if self.is_admin
				result = true
			elsif (self.id.nil?) || (self.id == '')
				result = ((object_right & orig_right) == orig_right)
			else
				result = false
				users_right = (orig_right << 4)
				group_right = (orig_right << 8)
				owner_right = (orig_right << 12)
				result = ((object_right & users_right) == users_right) if !result
				result = ((self.userid == object_userid) && ((object_right & owner_right) == owner_right)) if !result
				result = ((self.groupids.include?(object_groupid)) && ((object_right & group_right) == group_right)) if !result
			end
			return result
		end

		# noinspection RubyUnusedLocalVariable
		def has_global_right(mod_name, right_name)
			raise NotImplementedException.new
		end

		def valid_cookie_token?(token)
			@fields.include?(:cookie_tokens) && @fields[:cookie_tokens][:value].has_value?(token)
		end

		def generate_new_cookie_token
			return if (self.id.nil?) || (self.id == '')
			timestamp = Time.new.strftime('%Y-%m-%d %H:%M:%S')
			new_token = SecureRandom.hex(64)

			@fields[:cookie_tokens][:value]
			@fields[:cookie_tokens][:value][timestamp] = new_token
			@fields[:cookie_tokens][:changed] = true
			API.headers['X-test'] = @fields[:cookie_tokens][:value].to_s
			API.headers['X-persist-username'] = self.username
			API.headers['X-persist-token'] = new_token
			self.save_to_db
			return new_token
		end

		def clear_all_cookie_tokens
			@fields[:cookie_tokens][:value] = {}
			@fields[:cookie_tokens][:changed] = true
			self.save_to_db
		end

		def to_a(compact = false)
			result = super
			result[:fullname] = (result[:firstname].to_s + ' ' + result[:infix].to_s).strip + ' ' + result[:lastname].to_s
			if !self.id.nil?
				#TODO: create avatar support. If ready implement:
				#if (has_avatar)
				#else
				avatar = 'http://www.gravatar.com/avatar/' + Digest::MD5.hexdigest(self.email.to_s) + '?d=mm'
				#end
				result[:avatar] = avatar
				result[:may_update] = (API.current_user.is_admin) || (API.current_user.id == self.id) if (!compact)
			else
				result[:may_update] = false
			end
			return result
		end

	end


	class Users < DbObjects

		def initialize(where = {}, options = {})
			super('users', User, where, options)
		end

	end


end