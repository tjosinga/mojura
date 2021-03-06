# encoding: utf-8
# The classes in this file extend common datatypes with some extra functionality.
require 'bson'
require 'json'

# The Boolean module is used to mixin in the TrueClass and FalseClass for easy comparison.
# This way fields can be given the Boolean datatype instead of a TrueClass or a FalseClass.
module Boolean
end


# Adds the Boolean module into the TrueClass as mixin
class TrueClass
	include Boolean
end


# Adds the Boolean module into the FalseClass as mixin
class FalseClass
	include Boolean
end

# Adds to_h and to_json to BSON::OrderedHash
# source: http://stackoverflow.com/questions/2940156/in-ruby-mongodb-returns-a-bsonorderedhash-how-to-i-covert-it-to-json-using
class BSON::OrderedHash

	def to_h
		inject({}) { |acc, element| k,v = element; acc[k] = (if v.class == BSON::OrderedHash then v.to_h else v end); acc }
	end

	def to_json(options = {})
		JSON.generate(to_h, options) rescue '{}'
	end

end


# Adds a few extra methods to the standard Hash
class Hash

	# Removes all nil values from the hash. If the value is an array or hash, it will do this recursively.
	def remove_nil_values!
		self.delete_if { |_, v| v.nil? }
		self.each { |_, v| v.remove_nil_values! if (v.is_a?(Hash) || v.is_a?(Array)) }
	end

	# Changes all keys to symbols. If the value is an array or hash, it will do this recursively.
	def symbolize_keys!(recursive = true)
		self.keys.each { | key |
			if !key.is_a?(Symbol)
				val = self.delete(key)
				val.symbolize_keys! if (recursive && (val.is_a?(Hash) || val.is_a?(Array)))
				self[(key.to_sym rescue key) || key] = val
			end
			self[key.to_sym].symbolize_keys! if (recursive && (self[key.to_sym].is_a?(Hash) || self[key.to_sym].is_a?(Array)))
		}
		return self
	end

	# Changes all keys to strings.  If the value is an array or hash, it will do this recursively.
	def stringify_keys!(recursive = true)
		self.keys.each do |key|
			if !key.is_a?(String)
				val = self.delete(key)
				val.stringify_keys! if (recursive && (val.is_a?(Hash) || val.is_a?(Array)))
				self[(key.to_s rescue key) || key] = val
			end
		end
		return self
	end

	# Clones all data, including all subobjects
	def recursive_clone
		Marshal.load(Marshal.dump(self))
	end

	def flatten_hash(path_sep_char = '.', join_sep_char = "\n")
		result = {}
		self.each { | k, v |
			if v.is_a?(Hash)
				v.flatten_hash(path_sep_char, join_sep_char).each { | k2, v2 |
					result[(k.to_s + path_sep_char + k2.to_s).to_sym] = v2
				}
			elsif v.is_a?(Array)
				result[k] = v.join(join_sep_char)
			else
				result[k] = v
			end
		}
		return result
	end

	def flatten_hash!(path_sep_char = '.', join_sep_char = "\n")
		copy = flatten_hash(path_sep_char, join_sep_char)
		self.clear
		self.merge!(copy)
	end

end


# Adds a few extra methods to the standard Hash
class Array

	# Removes all nil values from the hash. If the value is an array or hash, it will do this recursively.
	def remove_nil_values!
		self.compact!
		self.each { |val| val.remove_nil_values! if (val.is_a?(Hash) || val.is_a?(Array)) }
	end

	# Changes all keys to symbols. If the value is an array or hash, it will do this recursively.
	def symbolize_keys!(recursive = true)
		self.map! { |val| val.symbolize_keys! if (recursive && (val.is_a?(Hash) || val.is_a?(Array))); val }
	end

	# Changes all keys to strings. If the value is an array or hash, it will do this recursively.
	def stringify_keys!(recursive = true)
		self.map! { |val| val.stringify_keys! if (recursive && (val.is_a?(Hash) || val.is_a?(Array))); val }
	end

	# Clones all data, including all subobjects
	def recursive_clone
		Marshal.load(Marshal.dump(self))
	end

end


# Adds a few extra methods to the standard String
class String

	# Returns true if a string is numeric.
	def numeric?
		self.to_i.to_s == self
	end

	# Strips single or double quotes at the start and end of the given string.
	def strip_quotes
		gsub(/\A['"]+|['"]+\Z/, '')
	end

	# Normalizes a string, remove diacritics (accents)
	def normalize
		tr(
			"ÀÁÂÃÄÅàáâãäåĀāĂăĄąÇçĆćĈĉĊċČčÐðĎďĐđÈÉÊËèéêëĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħÌÍÎÏìíîïĨĩĪīĬĭĮįİıĴĵĶķĸĹĺĻļĽľĿŀŁłÑñŃńŅņŇňŉŊŋÒÓÔÕÖØòóôõöøŌōŎŏŐőŔŕŖŗŘřŚśŜŝŞşŠšſŢţŤťŦŧÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųŴŵÝýÿŶŷŸŹźŻżŽž",
			"AAAAAAaaaaaaAaAaAaCcCcCcCcCcDdDdDdEEEEeeeeEeEeEeEeEeGgGgGgGgHhHhIIIIiiiiIiIiIiIiIiJjKkkLlLlLlLlLlNnNnNnNnnNnOOOOOOooooooOoOoOoRrRrRrSsSsSsSssTtTtTtUUUUuuuuUuUuUuUuUuUuWwYyyYyYZzZzZz")
	end

	def truncate(max_length, ellipses = '...')
		(self.length > max_length) ? self.to_s[0..max_length].gsub(/[^\w]\w+\s*$/, '...') : self.to_s
	end

end


module MojuraAPI

	# A class alias for BSON::ObjectId.
	class ObjectId < BSON::ObjectId
	end

	# Rights constants according the CRUD standard, though in this case CREATE is replaced by CUSTOM.
	# CREATE is used, but not within objects.
	RIGHT_CREATE = :create
	RIGHT_CUSTOM = :custom
	RIGHT_READ =   :read
	RIGHT_UPDATE = :update
	RIGHT_DELETE = :delete

end